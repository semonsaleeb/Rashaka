import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Product, ProductService, Category } from '../../../services/product';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { AuthService } from '../../../services/auth.service';
import { Downloadapp } from '../downloadapp/downloadapp';
import { FavoriteService } from '../../../services/favorite.service';
import { ComparePopup } from '../../../compare-popup/compare-popup';
import { CartItem } from '../../../../models/CartItem';

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

  progressValue = 80;
  isLoading = true;
  currentSlideIndex = 0;
  visibleCards = 3;
  isMobile = false;

  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  selectedCategory: number | 'all' = 'all';

  cartItems: CartItem[] = [];
  subtotal = 0;
  total = 0;
  discount = 0;

  predefinedRanges = [
    { label: '0-1000', min: 0, max: 1000, selected: false },
    { label: '1000-1500', min: 1000, max: 1500, selected: false },
    { label: '1500-2000', min: 1500, max: 2000, selected: false },
    { label: '2000-2500', min: 2000, max: 2500, selected: false }
  ];

  compareProducts: any[] = [];
  showComparePopup = false;

  private resizeHandler = () => {
    this.updateVisibleCards();
    this.checkIfMobile();
  };

  private GUEST_CART_KEY = 'guest_cart';
  products: any[] = [];
  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public cartState: CartStateService,
    private auth: AuthService,
    private router: Router,
    private favoriteService: FavoriteService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  // ---------------------- lifecycle ----------------------
  ngOnInit(): void {
    // -------------------------
    // 1️⃣ Handle window resize
    // -------------------------
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);

    // -------------------------
    // 2️⃣ Load products dynamically when query param changes
    // -------------------------
    this.route.queryParams.subscribe(params => {
      const categoryId = params['category_id'] ? Number(params['category_id']) : null;

      if (categoryId) {
        this.productService.getProductsByCategory(categoryId).subscribe({
          next: (products) => {
            console.log('📦 Products by category:', products);
            
            this.allProducts = [...products];
            this.filteredProducts = [...products];
            this.categories = this.extractUniqueCategories(this.allProducts);
          },
          error: (err) => console.error('Error fetching products by category:', err)
        });
      } else {
        this.fetchProductsAndFavorites();
      }
    });

    // -------------------------
    // 3️⃣ Load cart
    // -------------------------
    this.loadCart();

    // Subscribe to cart changes
    this.cartState.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.updateCartTotals();
    });

    // Update cart when offcanvas opens
    const offcanvasEl = document.getElementById('cartSidebar');
    if (offcanvasEl) {
      offcanvasEl.addEventListener('shown.bs.offcanvas', () => this.loadCart());
    }

    // -------------------------
    // 4️⃣ Subscribe to favorites
    // -------------------------
    this.favoriteService.favorites$.subscribe(favs => {
      const favoriteIds = new Set(favs.map(f => f.id));

      this.allProducts = this.allProducts.map(p => ({
        ...p,
        isFavorite: favoriteIds.has(p.id)
      }));
      this.filteredProducts = this.filteredProducts.map(p => ({
        ...p,
        isFavorite: favoriteIds.has(p.id)
      }));

      this.cdr.detectChanges();
    });
  }





  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  // ---------------------- responsive ----------------------
updateVisibleCards() {
  if (window.innerWidth <= 768) this.visibleCards = 1;
  else if (window.innerWidth <= 1024) this.visibleCards = 2;
  else this.visibleCards = 3;
}


  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  // ---------------------- products & favorites ----------------------
  private fetchProductsAndFavorites(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = [...products];
        this.filteredProducts = [...products];
        this.categories = this.extractUniqueCategories(this.allProducts);

        // 🟢 بس load init للـ favorites
        this.favoriteService.loadFavorites(token).subscribe({
          next: () => { this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }


  private loadProductsWithoutFavorites(products: Product[]): void {
    this.allProducts = products.map(p => ({ ...p, isFavorite: false }));
    this.filteredProducts = [...this.allProducts];
    this.categories = this.extractUniqueCategories(this.allProducts);
    this.isLoading = false;
  }

  private extractUniqueCategories(products: Product[]): Category[] {
    const categoryMap = new Map<number, Category>();
    products.forEach(product => product.categories.forEach(c => {
      if (!categoryMap.has(c.id)) categoryMap.set(c.id, c);
    }));
    return Array.from(categoryMap.values());
  }

  // ---------------------- filters ----------------------
  getCategoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name_ar ?? '';
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
    if (this.selectedCategories.includes(categoryId)) this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    else this.selectedCategories.push(categoryId);
    this.applyCombinedFilters();
  }

  // ---------------------- filters ----------------------
  filterByCategory(categoryId: number | 'all') {
    this.selectedCategory = categoryId;

    // حدث الـ query param في الـ URL بدون إعادة تحميل الصفحة
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category_id: categoryId },
      queryParamsHandling: 'merge', // يحافظ على أي params تانية موجودة
    });

    // حمل المنتجات بناءً على الكاتيجوري
    if (categoryId === 'all') {
      this.loadAllProducts();
      console.log("category all"+ this.loadAllProducts);
      
    } else {
      this.loadProductsByCategory(+categoryId);
    }
  }

  // المنتجات حسب الكاتيجوري
  loadProductsByCategory(categoryId: number) {
    this.productService.getProductsByCategory(categoryId).subscribe({
      next: products => {
        this.allProducts = [...products];
        this.filteredProducts = [...products];
        this.categories = this.extractUniqueCategories(this.allProducts);
      },
      error: err => console.error('Failed to load products by category:', err)
    });
  }

  // كل المنتجات
loadAllProducts() {
  this.productService.getProducts().subscribe({
    next: (products) => {
      console.log("🔍 All Products from API:", products); // اطبع هنا
      this.allProducts = [...products];
      this.filteredProducts = [...products];
      this.categories = this.extractUniqueCategories(this.allProducts);
    },
    error: (err) => console.error("Failed to load all products:", err)
  });
}



  filterBySearch(): void { this.applyCombinedFilters(); }
  applyPriceFilter(): void { this.applyCombinedFilters(); }

  applyPredefinedRange(index: number) {
    this.predefinedRanges[index].selected = !this.predefinedRanges[index].selected;
    const selectedRanges = this.predefinedRanges.filter(r => r.selected);
    this.priceMin = selectedRanges.length > 0 ? Math.min(...selectedRanges.map(r => r.min)) : null;
    this.priceMax = selectedRanges.length > 0 ? Math.max(...selectedRanges.map(r => r.max)) : null;
    this.applyCombinedFilters();
  }

  applyCombinedFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredProducts = this.allProducts.filter(p => {
      const matchesCategory = this.selectedCategories.length === 0 || p.categories.some(c => this.selectedCategories.includes(c.id));
      const name = (p.name_ar ?? '').toLowerCase();
      const matchesSearch = q === '' || name.includes(q);
      const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      const meetsMin = this.priceMin === null || priceNum >= this.priceMin;
      const meetsMax = this.priceMax === null || priceNum <= this.priceMax;
      return matchesCategory && matchesSearch && meetsMin && meetsMax;
    });
    this.currentSlideIndex = 0;
  }

  // ---------------------- auth ----------------------
  isLoggedIn(): boolean { return this.auth.isLoggedIn(); }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/auth']).then(() => window.location.reload());
      },
      error: () => {
        localStorage.clear();
        this.router.navigate(['/auth']).then(() => window.location.reload());
      }
    });
  }

  // ---------------------- favorites ----------------------
  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const token = localStorage.getItem('token');

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: (res) => {
        // ✅ لو عندك favorites$ في الـ service هيحدث تلقائي
        if (!this.favoriteService.favorites$) {
          // 🔄 Manual flip fallback
          product.isFavorite = !product.isFavorite;
        }
      },
      error: (err) => console.error('Error toggling favorite:', err)
    });
  }







  // ---------------------- cart helpers ----------------------
  private handleCartActionError(err: HttpErrorResponse): void {
    console.error('❌ Cart action failed:', err);
    if (err.status === 401) { this.auth.logout(); this.resetCartState(); this.router.navigate(['/auth/login']); }
  }

  private resetCartState(): void {
    this.cartItems = [];
    this.cartState.updateCount(0);
  }

  private loadGuestCart(): CartItem[] {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  private saveGuestCart(cart: CartItem[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    this.cartItems = [...cart];
    this.updateCartTotals();
    this.cdr.detectChanges();
  }

  private loadCart(): void {
    if (!this.isLoggedIn()) {
      // guest cart
      const guestCart = this.loadGuestCart();
      this.cartState.updateItems(guestCart);
    } else {
      // logged in user
      this.cartService.getCart().subscribe({
        next: (res) => {
          const items: CartItem[] = res.data.items; // حسب شكل الـ CartResponse
          this.cartState.updateItems(items);
          this.saveGuestCart(items); // لو حابب تعمل sync مع localStorage
        },
        error: (err) => console.error('Failed to load user cart', err)
      });

    }
  }



  private updateCartTotals(): void {
    this.subtotal = this.cartItems.reduce(
      (sum, i) => sum + ((Number(i.sale_unit_price) || Number(i.unit_price)) * i.quantity),
      0
    );
    this.total = this.subtotal - this.discount;
    const count = this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    this.cartState.updateCount(count);
  }

  // ---------------------- cart actions ----------------------
  addToCart(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const unitPrice = Number(product.price_before ?? product.price ?? product.original_price ?? 0);
    const saleUnitPrice = Number(product.price_after ?? product.sale_price ?? 0);
    const finalPrice = saleUnitPrice > 0 ? saleUnitPrice : unitPrice;

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const existing = cart.find(i => i.product_id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          product_id: product.id,
          quantity: 1,
          product_name: product.name ?? 'منتج بدون اسم',
          product_name_ar: product.name_ar ?? 'منتج بدون اسم',
          unit_price: String(unitPrice),
          sale_unit_price: String(saleUnitPrice),
          final_price: String(finalPrice),
          images: product.images ?? []
        });
      }

      this.saveGuestCart(cart);

      // ❌ شيلنا الكود اللي بيفتح السلة أوتوماتيك
      return;
    }

    // Logged-in user
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.loadCart();
        // ❌ شيلنا الكود اللي بيفتح السلة أوتوماتيك
      },
      error: (err) => this.handleCartActionError(err)
    });
  }





  // removeItem(product_id: number, event?: Event): void {
  //   if (event) { event.preventDefault(); event.stopPropagation(); }

  //   if (!this.isLoggedIn()) {
  //     const cart = this.loadGuestCart().filter(i => i.product_id !== product_id);
  //     this.saveGuestCart(cart);
  //     this.cartState.removeItem(product_id);
  //     return;
  //   }

  //   this.cartService.removeCartItem(product_id).subscribe({ next: () => this.loadCart(), error: err => this.handleCartActionError(err) });
  // }

  increaseQuantity(productId: number): void {
    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) item.quantity++;
      this.saveGuestCart(cart);
      return;
    }
    this.cartService.addToCart(productId, 1).subscribe({ next: () => this.loadCart() });
  }

  decreaseQuantity(productId: number): void {
    if (!this.isLoggedIn()) {
      let cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) {
        item.quantity--;
        if (item.quantity <= 0) {
          cart = cart.filter(i => i.product_id !== productId);
        }
      }
      this.saveGuestCart(cart);
      return;
    }
    this.cartService.reduceCartItem(productId).subscribe({ next: () => this.loadCart() });
  }

  removeItem(productId: number): void {
    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart().filter(i => i.product_id !== productId);
      this.saveGuestCart(cart);
      return;
    }
    this.cartService.removeCartItem(productId).subscribe({ next: () => this.loadCart() });
  }

  private modifyQuantity(product_id: number, delta: number, event?: Event) {
    event?.stopPropagation();
    const currentItems = this.cartState['cartItemsSource'].getValue();
    const item = currentItems.find(i => i.product_id === product_id); if (!item) return;
    const newQty = item.quantity + delta;

    if (newQty > 0) {
      if (!this.isLoggedIn()) { item.quantity = newQty; this.saveGuestCart(currentItems); this.cartState.updateSingleItem(item); }
      else this.cartService.updateQuantity(product_id, newQty).subscribe({ next: () => this.loadCart() });
    } else { this.removeItem(product_id); }
  }

  isInCart(product_id: number | string): boolean {
    // console.log(this.cartItems);

    return this.cartItems.some(i => Number(i.product_id) === Number(product_id));
  }

  getCartItem(product_id: number | string) {
    return this.cartItems.find(i => Number(i.product_id) === Number(product_id));
  }

  // ---------------------- compare ----------------------
  addToCompare(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.compareProducts.find(p => p.id === product.id)) {
      alert('هذا المنتج مضاف بالفعل للمقارنة');
      return;
    }

    if (this.compareProducts.length >= 2) {
      alert('لا يمكنك إضافة أكثر من منتجين للمقارنة');
      return;
    }

    this.compareProducts.push(product);

    if (this.compareProducts.length === 1) {
      alert('تم إضافة المنتج الأول، من فضلك اختر منتج آخر للمقارنة');
    }

    if (this.compareProducts.length === 2) {
      this.showComparePopup = true;
    }
  }


  onCloseComparePopup(): void {
    this.showComparePopup = false;
    this.compareProducts = [];
  }

  openSidebar() { const modal = new (window as any).bootstrap.Modal(document.getElementById('filtersModal')); modal.show(); }

  touchStartX = 0; touchEndX = 0;
  onTouchStart(event: TouchEvent) { this.touchStartX = event.changedTouches[0].screenX; }
  onTouchEnd(event: TouchEvent) { this.touchEndX = event.changedTouches[0].screenX; this.handleSwipe(); }
  handleSwipe(): void { const swipeDistance = this.touchEndX - this.touchStartX; if (Math.abs(swipeDistance) > 50) { swipeDistance > 0 ? this.nextSlide() : this.prevSlide(); } }
  nextSlide(): void { const maxIndex = Math.max(0, this.getTotalSlides() - 1); if (this.currentSlideIndex < maxIndex) this.currentSlideIndex++; }
  prevSlide(): void { if (this.currentSlideIndex > 0) this.currentSlideIndex--; }
getTotalSlides(): number {
  if (!this.filteredProducts) return 0;
  return Math.ceil(this.filteredProducts.length / this.visibleCards);
}
  getDotsArray(): number[] { return Array.from({ length: this.getTotalSlides() }, (_, i) => i); }
  goToSlide(index: number) { this.currentSlideIndex = Math.min(Math.max(index, 0), this.getTotalSlides() - 1); }
}