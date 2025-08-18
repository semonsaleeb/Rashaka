import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Product, ProductService, Category } from '../../../services/product';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { AuthService } from '../../../services/auth.service';
import { Downloadapp } from '../downloadapp/downloadapp';
import { FavoriteService } from '../../../services/favorite.service';
import { ComparePopup } from '../../../compare-popup/compare-popup';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule, Downloadapp, ComparePopup],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit, OnDestroy {
  @Input() mode: 'grid' | 'carousel' = 'grid';

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategories: number[] = [];

  isLoading = true;
  currentSlideIndex = 0;
  visibleCards = 3;
  isMobile = false;

  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  selectedCategory: number | 'all' = 'all';

  cartItems: any[] = [];

  predefinedRanges = [
    { label: '0-1000',   min: 0,    max: 1000, selected: false },
    { label: '1000-1500',min: 1000, max: 1500, selected: false },
    { label: '1500-2000',min: 1500, max: 2000, selected: false },
    { label: '2000-2500',min: 2000, max: 2500, selected: false }
  ];

  // single bound resize handler so we can properly remove it
  private resizeHandler = () => {
    this.updateVisibleCards();
    this.checkIfMobile();
  };

  compareProducts: any[] = [];
  showComparePopup = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public  cartState: CartStateService,
    private auth: AuthService,
    private router: Router,
    private favoriteService: FavoriteService,
  ) {}

  // ---------- lifecycle ----------
  ngOnInit(): void {
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);

    this.fetchProductsAndFavorites();  // single source of truth
    this.loadCart();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  // ---------- responsive ----------
  updateVisibleCards() {
    if (window.innerWidth <= 768) {
      this.visibleCards = 1;
    } else if (window.innerWidth <= 1024) {
      this.visibleCards = 2;
    } else {
      this.visibleCards = 4;
    }
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  // ---------- data ----------
  private fetchProductsAndFavorites(): void {
    this.isLoading = true;

    const token = localStorage.getItem('token');

    // get all products first
    this.productService.getProducts().subscribe({
      next: (products) => {
        // if logged in, load favorites and merge
        if (token) {
          this.favoriteService.loadFavorites(token).subscribe({
            next: (favorites) => {
              const favoriteIds = new Set(favorites.map(f => f.id));
              this.allProducts = products.map(p => ({ ...p, isFavorite: favoriteIds.has(p.id) }));
              this.filteredProducts = [...this.allProducts];
              this.categories = this.extractUniqueCategories(this.allProducts);
              this.isLoading = false;
            },
            error: () => {
              // fallback to plain products on favorites error
              this.allProducts = products.map(p => ({ ...p, isFavorite: false }));
              this.filteredProducts = [...this.allProducts];
              this.categories = this.extractUniqueCategories(this.allProducts);
              this.isLoading = false;
            }
          });
        } else {
          // not logged in: no favorites
          this.allProducts = products.map(p => ({ ...p, isFavorite: false }));
          this.filteredProducts = [...this.allProducts];
          this.categories = this.extractUniqueCategories(this.allProducts);
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }

  private extractUniqueCategories(products: Product[]): Category[] {
    const categoryMap = new Map<number, Category>();
    products.forEach(product => {
      product.categories.forEach(category => {
        if (!categoryMap.has(category.id)) categoryMap.set(category.id, category);
      });
    });
    return Array.from(categoryMap.values());
  }

  // ---------- filters ----------
  getCategoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? (cat.name_ar ?? '') : '';
  }

  clearAllCategories(): void {
    this.selectedCategories = [];
    this.applyCombinedFilters();
  }

  removeCategory(categoryId: number): void {
    this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    this.applyCombinedFilters();
  }

  toggleCategory(categoryId: number): void {
    if (this.selectedCategories.includes(categoryId)) {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    } else {
      this.selectedCategories.push(categoryId);
    }
    this.applyCombinedFilters();
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
    this.currentSlideIndex = 0;
  }

  filterBySearch(): void {
    this.applyCombinedFilters();
  }

  applyPriceFilter(): void {
    this.applyCombinedFilters();
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

  applyCombinedFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredProducts = this.allProducts.filter(p => {
      const matchesCategory =
        this.selectedCategories.length === 0 ||
        p.categories.some(c => this.selectedCategories.includes(c.id));

      const name = (p.name_ar ?? '').toLowerCase();
      const matchesSearch = q === '' || name.includes(q);

      const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      const meetsMin = this.priceMin === null || priceNum >= this.priceMin;
      const meetsMax = this.priceMax === null || priceNum <= this.priceMax;

      return matchesCategory && matchesSearch && meetsMin && meetsMax;
    });

    this.currentSlideIndex = 0;
  }

  // ---------- carousel ----------
  getTotalSlides(): number {
    const per = Math.max(1, this.visibleCards);
    return Math.max(1, Math.ceil(this.filteredProducts.length / per));
  }

  getDotsArray(): number[] {
    const per = Math.max(1, this.visibleCards);
    const slideCount = Math.ceil(this.filteredProducts.length / per);
    if (slideCount <= 1) return []; // no dots if 0 or 1 slide
    return Array.from({ length: slideCount }, (_, i) => i);
  }

  nextSlide(): void {
    const maxIndex = Math.max(0, this.getTotalSlides() - 1);
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  goToSlide(index: number): void {
    const maxIndex = Math.max(0, this.getTotalSlides() - 1);
    this.currentSlideIndex = Math.min(Math.max(0, index), maxIndex);
  }

  // ---------- auth helpers ----------
  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  // ---------- favorites ----------
  toggleFavorite(product: Product): void {
    if (!this.isLoggedIn()) {
      alert('يرجى تسجيل الدخول أولاً لإضافة المنتج إلى المفضلة');
      this.router.navigate(['/auth/login']);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

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

  // ---------- cart ----------
  addToCart(productId: number): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: (err: HttpErrorResponse) => this.handleCartActionError(err, /*redirectOn401*/ true)
    });
  }

  private loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => this.handleCartResponse(response),
      error: (err: HttpErrorResponse) => this.handleCartActionError(err, /*redirectOn401*/ false)
    });
  }

  private handleCartResponse(response: any): void {
    this.cartItems = response?.data?.items || [];
    const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(total);
  }

  private resetCartState(): void {
    this.cartItems = [];
    this.cartState.updateCount(0);
  }

  private handleCartActionError(err: HttpErrorResponse, redirectOn401: boolean): void {
    const apiMessage = err?.error?.message;

    // ignore benign messages
    if (apiMessage === 'Cart is empty') {
      this.resetCartState();
      return;
    }

    // unauthenticated handling
    if (err.status === 401 || apiMessage === 'Unauthenticated.') {
      this.auth.logout();
      this.resetCartState();
      if (redirectOn401) this.router.navigate(['/auth/login']);
      return;
    }

    console.error('❌ Cart action failed:', err);
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
      error: (err: HttpErrorResponse) => this.handleCartActionError(err, true)
    });
  }

  decreaseQuantity(productId: number) {
    this.cartService.reduceCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: (err: HttpErrorResponse) => this.handleCartActionError(err, true)
    });
  }

  removeItem(productId: number) {
    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: (err: HttpErrorResponse) => this.handleCartActionError(err, true)
    });
  }

  // ---------- compare ----------
  addToCompare(product: any) {
    if (this.compareProducts.find((p: any) => p.id === product.id)) return;
    if (this.compareProducts.length >= 2) {
      alert('⚠️ لا يمكن مقارنة أكثر من منتجين');
      return;
    }
    this.compareProducts.push(product);
    if (this.compareProducts.length === 1) {
      alert('✅ تم إضافة المنتج الأول، الرجاء اختيار منتج آخر للمقارنة');
    }
    if (this.compareProducts.length === 2) {
      this.showComparePopup = true;
    }
  }

  onCloseComparePopup() {
    this.showComparePopup = false;
    this.compareProducts = [];
  }
}
