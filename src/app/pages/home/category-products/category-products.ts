import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Product, ProductService, Category } from '../../../services/product';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { AuthService } from '../../../services/auth.service';
import { Blogs } from '../blogs/blogs';
import { Downloadapp } from '../downloadapp/downloadapp';
import { FavoriteService } from '../../../services/favorite.service';
import { ComparePopup } from '../../../compare-popup/compare-popup';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule, Blogs, Downloadapp, ComparePopup],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit {
  @Input() mode: 'grid' | 'carousel' = 'grid';

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  categories: Category[] = [];
  selectedCategories: number[] = [];
  currentSlideIndex = 0;
  visibleCards = 3; // عدد الكروت المعروضة في نفس الوقت
  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  selectedCategory: number | 'all' = 'all';
  cartItems: any[] = [];

  predefinedRanges = [
    { label: '0-1000', min: 0, max: 1000, selected: false },
    { label: '1000-1500', min: 1000, max: 1500, selected: false },
    { label: '1500-2000', min: 1500, max: 2000, selected: false },
    { label: '2000-2500', min: 2000, max: 2500, selected: false }
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public cartState: CartStateService,
    private auth: AuthService,               // ✅ inject auth
    private router: Router,
    private favoriteService: FavoriteService,

  ) { }

  ngOnInit(): void {
    this.fetchProducts();
    this.loadCart();
    this.loadProductsAndFavorites();

  }

  private fetchProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.filteredProducts = [...products];
        this.categories = this.extractUniqueCategories(products);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }
  getTotalSlides(): number {
    return Math.ceil(this.filteredProducts.length / this.visibleCards);
  }
  getCategoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name_ar : '';
  }

  clearAllCategories(): void {
    this.selectedCategories = [];
    this.applyCombinedFilters();
  }

  filterBySearch(): void {
    this.applyCombinedFilters();
  }

  applyPriceFilter(): void {
    this.applyCombinedFilters();
  }
  removeCategory(categoryId: number): void {
    this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    this.applyCombinedFilters();
  }
  private extractUniqueCategories(products: Product[]): Category[] {
    const categoryMap = new Map<number, Category>();
    products.forEach(product => {
      product.categories.forEach(category => {
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });
    return Array.from(categoryMap.values());
  }

  filterByCategory(categoryId: number | 'all'): void {
    this.selectedCategory = categoryId;
    if (categoryId === 'all') {
      this.filteredProducts = [...this.allProducts];
    } else {
      this.filteredProducts = this.allProducts.filter(product =>
        product.categories.some(c => c.id === categoryId)
      );
    }
    this.currentSlideIndex = 0; // Reset to first slide when filtering
  }

  // Carousel Navigation
  nextSlide(): void {
    const maxSlides = Math.ceil(this.filteredProducts.length / this.visibleCards) - 1;
    if (this.currentSlideIndex < maxSlides) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  getDotsArray(): number[] {
    const slideCount = Math.ceil(this.filteredProducts.length / this.visibleCards);
    return Array.from({ length: slideCount }, (_, i) => i);
  }

  // Cart Functions
  addToCart(productId: number): void {
    this.cartService.addToCart(productId).subscribe({
      next: () => this.refreshCartCount(),
      error: (err) => console.error('Failed to add to cart', err)
    });
  }

  refreshCartCount(): void {
    this.cartService.getCart().subscribe(response => {
      const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
      this.cartState.updateCount(count);
    });
  }




  // بقية الدوال كما هي
  toggleCategory(categoryId: number): void {
    if (this.selectedCategories.includes(categoryId)) {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    } else {
      this.selectedCategories.push(categoryId);
    }
    this.applyCombinedFilters();
  }

  applyCombinedFilters(): void {
    this.filteredProducts = this.allProducts.filter(p => {
      const matchesCategory =
        this.selectedCategories.length === 0 ||
        p.categories.some(c => this.selectedCategories.includes(c.id));

      const matchesSearch = p.name_ar.includes(this.searchQuery);

      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      const meetsMin = this.priceMin === null || price >= this.priceMin;
      const meetsMax = this.priceMax === null || price <= this.priceMax;

      return matchesCategory && matchesSearch && meetsMin && meetsMax;
    });
    this.currentSlideIndex = 0; // Reset to first slide after filtering
  }

  applyPredefinedRange(index: number) {
    this.predefinedRanges[index].selected = !this.predefinedRanges[index].selected;
    const selectedRanges = this.predefinedRanges.filter(r => r.selected);

    if (selectedRanges.length > 0) {
      const allMins = selectedRanges.map(r => r.min);
      const allMaxs = selectedRanges.map(r => r.max);
      this.priceMin = Math.min(...allMins);
      this.priceMax = Math.max(...allMaxs);
    } else {
      this.priceMin = null;
      this.priceMax = null;
    }
    this.applyCombinedFilters();
  }


  private loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => this.handleCartResponse(response),
      error: (err: HttpErrorResponse) => this.handleCartError(err)
    });
  }

  private handleCartResponse(response: any): void {
    this.cartItems = response.data?.items || [];
    const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(total);
  }
  private resetCartState(): void {
    this.cartItems = [];
    this.cartState.updateCount(0);
  }
  private handleCartError(err: HttpErrorResponse): void {
    console.error('❌ Error loading cart:', err);
    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    } else {
      this.resetCartState();
    }
  }

  isInCart(productId: number): boolean {
    return this.cartItems.some(item => item.product_id === productId);
  }

  getCartItem(productId: number) {
    return this.cartItems.find(item => item.product_id === productId);
  }


  increaseQuantity(productId: number) {
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: err => console.error(err)
    });
  }

  decreaseQuantity(productId: number) {
    this.cartService.reduceCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: err => console.error(err)
    });
  }

  removeItem(productId: number) {
    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: err => console.error(err)
    });
  }



  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }
  toggleFavorite(product: Product): void {
    if (!this.isLoggedIn) {
      alert('يرجى تسجيل الدخول أولاً لإضافة المنتج إلى المفضلة');
      this.router.navigate(['/auth/login']);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: () => {
        product.isFavorite = !product.isFavorite;

        const currentFavorites = this.favoriteService.getFavorites();
        if (product.isFavorite) {
          this.favoriteService.setFavorites([...currentFavorites, product]);
        } else {
          const updated = currentFavorites.filter(p => p.id !== product.id);
          this.favoriteService.setFavorites(updated);
        }
      },
      error: err => {
        console.error('Error updating favorite:', err);
      }
    });
  }

  loadProductsAndFavorites(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.productService.getProducts().subscribe(products => {
      this.favoriteService.loadFavorites(token).subscribe(favorites => {
        this.allProducts = products.map(product => ({
          ...product,
          isFavorite: favorites.some(fav => fav.id === product.id)
        }));

        this.filteredProducts = [...this.allProducts]; // initialize filtered list
        this.favoriteService.setFavorites(favorites); // updates favorite count
      });
    });
  }

 compareProducts: any[] = [];
  showComparePopup = false;

 addToCompare(product: any) {
  // 1. Prevent duplicate selection
  if (this.compareProducts.find(p => p.id === product.id)) return;

  // 2. Prevent adding more than 2 products
  if (this.compareProducts.length >= 2) {
    alert('⚠️ لا يمكن مقارنة أكثر من منتجين');
    return;
  }

  // 3. Add product to comparison list
  this.compareProducts.push(product);

  // 4. If this is the first product added, prompt to add another
  if (this.compareProducts.length === 1) {
    alert('✅ تم إضافة المنتج الأول، الرجاء اختيار منتج آخر للمقارنة');
  }

  // 5. If this is the second product, show the compare popup
  if (this.compareProducts.length === 2) {
    this.showComparePopup = true;
  }
}



  onCloseComparePopup() {
    this.showComparePopup = false;
    this.compareProducts = [];
  }
}