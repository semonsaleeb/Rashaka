import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../services/product';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { AuthService } from '../../../services/auth.service';
import { Downloadapp } from '../downloadapp/downloadapp';
import { FavoriteService } from '../../../services/favorite.service';
import { ComparePopup } from '../../../compare-popup/compare-popup';
import { CartItem } from '../../../../models/CartItem';
import { Product } from '../../../../models/Product';
import { Category } from '../../../../models/Category';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { TruncatePipe } from '../../../truncate-pipe';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule,TruncatePipe, HttpClientModule, RouterModule, FormsModule, Downloadapp, ComparePopup, TranslateModule],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit, OnDestroy {
  @Input() mode: 'grid' | 'carousel' = 'grid';

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategories: number[] = [];
  lang: 'ar' | 'en' = 'ar'; // default Arabic
topSellers: any[] = [];

  progressValue = 80;
  isLoading = true;
  currentSlideIndex = 0;
  visibleCards = 3;
  isMobile = false;

  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  selectedCategory: number | 'all' = 'all';

  currentLang: string = 'ar';

  cartItems: CartItem[] = [];
  subtotal = 0;
  total = 0;
  discount = 0;

  predefinedRanges = [
    { label: '0-1000', min: 0, max: 1000, selected: false },
    { label: '1000-1500', min: 1000, max: 1500, selected: false },
    { label: '1500-2000', min: 1500, max: 2000, selected: false },
    { label: '2000-2500', min: 2000, max: 2500, selected: false },
        { label: '2500-4000', min: 2500, max: 4000 , selected: false }

  ];

  compareProducts: any[] = [];
  showComparePopup = false;

  private resizeHandler = () => {
    this.updateVisibleCards();
    this.checkIfMobile();
  };
trackByProductId(index: number, product: any): number {
  return product.id;
}

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
    private route: ActivatedRoute,
    private translate: TranslateService,
    private languageService: LanguageService,
    
  ) { }

  // ---------------------- lifecycle ----------------------
ngOnInit(): void {
  // ✅ Handle responsive layout
  this.resizeHandler();
  window.addEventListener('resize', this.resizeHandler);

  // ✅ Read category_id from URL query parameters
  this.route.queryParams.subscribe(params => {
    const categoryId = params['category_id'] ? Number(params['category_id']) : null;

    if (categoryId && !isNaN(categoryId)) {
      // Pre-select the category
      if (!this.selectedCategories.includes(categoryId)) {
        this.selectedCategories.push(categoryId);
      }

      // Fetch products for this category
      this.productService.getProductsByCategory(categoryId).subscribe({
        next: (products) => {
          this.allProducts = [...products];
          this.filteredProducts = [...products];
          this.categories = this.extractUniqueCategories(this.allProducts);

          // ✅ اضبط البداية حسب اللغة
          this.setInitialSlide();

          // Apply filters including the pre-selected category
          this.applyCombinedFilters();
        },
        error: (err) => console.error('Error fetching products by category:', err)
      });
    } else {
      // Fetch all products if no category_id in URL
      this.fetchProductsAndFavorites();
    }
  });

  // ✅ Fetch Top Sellers from API directly
  this.productService.getTopSellers().subscribe({
    next: (products) => {
      this.topSellers = products;
    },
    error: (err) => {
      console.error('Error fetching top sellers:', err);
    }
  });

  // ✅ Load cart and subscribe to updates
  this.loadCart();
  this.cartState.cartItems$.subscribe(items => {
    this.cartItems = items;
    this.updateCartTotals();
  });

  // ✅ Subscribe to favorite changes
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

  // ✅ Handle language changes
  this.translate.use(this.languageService.getCurrentLanguage());
  this.currentLang = this.languageService.getCurrentLanguage();

  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.textDir = lang === 'ar' ? 'rtl' : 'ltr';
  });

  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.translate.use(lang);

    // ✅ لما اللغة تتغير اضبط مكان البداية
    this.setInitialSlide();
  });

  // ✅ Optional: reload cart when sidebar opens
  const offcanvasEl = document.getElementById('cartSidebar');
  if (offcanvasEl) {
    offcanvasEl.addEventListener('shown.bs.offcanvas', () => this.loadCart());
  }
}


// 🔥 Helper function
private setInitialSlide(): void {
  if (this.currentLang === 'ar') {
    // ابدأ من آخر سلايد (يمين)
    this.currentSlideIndex = Math.max(this.filteredProducts.length - this.visibleCards, 0);
  } else {
    // ابدأ من أول سلايد (شمال)
    this.currentSlideIndex = 0;
  }
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

  private fetchProductsAndFavorites(categoryId?: number): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    const products$ = categoryId && categoryId !== 0
      ? this.productService.getProductsByCategory(categoryId)
      : this.productService.getProducts();

    products$.subscribe({
      next: (products) => {
        this.allProducts = [...products];
        this.filteredProducts = [...products];
        this.categories = this.extractUniqueCategories(this.allProducts);

        // 🟢 بعد ما المنتجات تتجاب نجيب الفيفوريت
        this.favoriteService.loadFavorites(token).subscribe({
          next: () => (this.isLoading = false),
          error: () => (this.isLoading = false),
        });
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      },
    });
  }



  // private loadProductsWithoutFavorites(products: Product[]): void {
  //   this.allProducts = products.map(p => ({ ...p, isFavorite: false }));
  //   this.filteredProducts = [...this.allProducts];
  //   this.categories = this.extractUniqueCategories(this.allProducts);
  //   this.isLoading = false;
  // }

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
  filterByCategorycarousel(categoryId: number | 'all') {
    this.selectedCategory = categoryId;

    if (categoryId === 'all') {
      // رجّع كل المنتجات الأصلية
      this.filteredProducts = [...this.allProducts];
    } else {
      // فلترة محلياً من اللي عندك
      this.filteredProducts = this.allProducts.filter(p =>
        p.categories.some(c => c.id === categoryId)
      );
    }

    // Reset السلايدر
    this.currentSlideIndex = 0;
  }
  trackByCategory(index: number, category: Category): number {
    return category.id;
  }



  filterByCategory(categoryId: number | 'all') {
    this.selectedCategory = categoryId;

    // بس حدث الـ query param
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category_id: categoryId },
      queryParamsHandling: 'merge',
    });

    if (categoryId === 'all') {
      this.productService.getProducts()
    } else {
      this.productService.getProductsByCategory(categoryId)

    }
  }



  // المنتجات حسب الكاتيجوري
  loadProductsByCategory(categoryId: number) {
    this.productService.getProductsByCategory(categoryId).subscribe({
      next: products => {
        this.allProducts = [...products];
        this.filteredProducts = [...products];
        this.categories = this.extractUniqueCategories(this.allProducts);

        // 🟢 Open in middle on mobile
        if (this.isMobile) {
          this.currentSlideIndex = Math.floor(this.getTotalSlides() / 2);
        } else {
          this.currentSlideIndex = 0;
        }
      },
      error: err => console.error('Failed to load products by category:', err)
    });
  }

  // كل المنتجات
  loadAllProducts() {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = [...products];
        this.filteredProducts = [...products];
        this.categories = this.extractUniqueCategories(this.allProducts);

        // 🟢 Open in middle on mobile
        if (this.isMobile) {
          this.currentSlideIndex = Math.floor(this.getTotalSlides() / 2);
        } else {
          this.currentSlideIndex = 0;
        }
      },
      error: (err) => console.error("Failed to load all products:", err)
    });
  }

  getActiveProductIndex(): number {
    return (this.currentSlideIndex * this.visibleCards) + Math.floor(this.visibleCards / 2);
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
    const matchesCategory =
      this.selectedCategories.length === 0 ||
      p.categories?.some(c => this.selectedCategories.includes(c.id));

    const name = (p.name_ar ?? '').toLowerCase();
    const matchesSearch = q === '' || name.includes(q);

    // Parse price safely
    let priceNum = 0;
    if (p.price !== null && p.price !== undefined) {
      priceNum =
        typeof p.price === 'string'
          ? parseFloat(p.price.replace(/,/g, '')) || 0
          : Number(p.price) || 0;
    }

    // Predefined ranges
    const selectedRanges = this.predefinedRanges.filter(r => r.selected);
    const matchesRange =
      selectedRanges.length === 0 ||
      selectedRanges.some(r => priceNum >= r.min && priceNum <= r.max);

    // Price from inputs
    const meetsMin = this.priceMin == null || priceNum >= this.priceMin;
    const meetsMax = this.priceMax == null || priceNum <= this.priceMax;

    return matchesCategory && matchesSearch && matchesRange && meetsMin && meetsMax;
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

  const unitPrice = safeNumber(product.price_before ?? product.price ?? product.original_price ?? 0);
  const saleUnitPrice = safeNumber(product.price_after ?? product.sale_price ?? 0);
  const finalPrice = saleUnitPrice > 0 ? saleUnitPrice : unitPrice;

  if (!this.isLoggedIn()) {
    const cart = this.loadGuestCart();
    const existing = cart.find(i => i.product_id === product.id);

    if (existing) {
      existing.quantity += 1;
      console.log("🔄 Updated Guest Cart Item:", existing);
    } else {
      const newItem = {
        product_id: product.id,
        product_name: product.name ?? 'منتج بدون اسم',
        product_name_ar: product.name_ar ?? 'منتج بدون اسم',
        quantity: 1,
        unit_price: unitPrice,
        sale_unit_price: saleUnitPrice || unitPrice,
        final_price: String(finalPrice),
        images: product.images ?? []
      };

      console.log("🆕 Adding New Guest Cart Item:", newItem);
      cart.push(newItem);
    }

    console.log("🛒 Guest Cart Before Save:", cart);
    this.saveGuestCart(cart);
    this.cartState.updateItems(cart); // ✅ Sync UI
    return;
  }

  this.cartService.addToCart(product.id, 1).subscribe({
    next: () => {
      console.log("✅ Added to Logged-in Cart:", product);
      this.loadCart();
    },
    error: (err) => this.handleCartActionError(err)
  });
}

increaseQuantity(productId: number): void {
  if (!this.isLoggedIn()) {
    const cart = this.loadGuestCart();
    const item = cart.find(i => i.product_id === productId);
    if (item) {
      item.quantity++;
    }
    this.saveGuestCart(cart);
    this.cartState.updateItems(cart); // ✅ Sync UI
    return;
  }

  this.cartService.addToCart(productId, 1).subscribe({
    next: () => this.loadCart()
  });
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
    this.cartState.updateItems(cart); // ✅ Sync UI
    return;
  }

  this.cartService.reduceCartItem(productId).subscribe({
    next: () => this.loadCart()
  });
}

removeItem(productId: number): void {
  if (!this.isLoggedIn()) {
    const cart = this.loadGuestCart().filter(i => i.product_id !== productId);
    this.saveGuestCart(cart);
    this.cartState.updateItems(cart); // ✅ Sync UI
    return;
  }

  this.cartService.removeCartItem(productId).subscribe({
    next: () => this.loadCart()
  });
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

  // category-products.ts
  // get displayName(): string {
  //   return this.currentLang === 'ar'
  //     ? this.product?.name_ar ?? ''
  //     : this.product?.name ?? '';
  // }

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
  nextSlide(): void { const maxIndex = Math.max(0, this.getTotalSlides() - 1); if (this.currentSlideIndex < maxIndex) this.currentSlideIndex++; }
  prevSlide(): void { if (this.currentSlideIndex > 0) this.currentSlideIndex--; }
  getTotalSlides(): number {
    if (!this.filteredProducts) return 0;
    return Math.ceil(this.filteredProducts.length / this.visibleCards);
  }
  getDotsArray(): number[] { return Array.from({ length: this.getTotalSlides() }, (_, i) => i); }
  goToSlide(index: number) { this.currentSlideIndex = Math.min(Math.max(index, 0), this.getTotalSlides() - 1); }
textDir: 'rtl' | 'ltr' = 'ltr';

  // handleSwipe(): void { const swipeDistance = this.touchEndX - this.touchStartX; if (Math.abs(swipeDistance) > 50) { swipeDistance > 0 ? this.nextSlide() : this.prevSlide(); } }
  private readonly SWIPE_THRESHOLD = 50;

handleSwipe(): void {
  const swipeDistance = this.touchEndX - this.touchStartX;

  if (Math.abs(swipeDistance) > 50) {
    const isRTL = this.currentLang === 'ar';

    if ((swipeDistance > 0 && !isRTL) || (swipeDistance < 0 && isRTL)) {
      // سوايب يمين في LTR → prev
      // سوايب شمال في RTL → prev
      this.prevSlide();
    } else {
      // سوايب شمال في LTR → next
      // سوايب يمين في RTL → next
      this.nextSlide();
    }
  }
}



}

function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, '')); // 🟢 يشيل الكوما
  }
  return Number(value);
}
