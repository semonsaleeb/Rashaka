import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, NgZone, inject } from '@angular/core';
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
  imports: [CommonModule, TruncatePipe, HttpClientModule, RouterModule, FormsModule, Downloadapp, ComparePopup, TranslateModule],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit, OnDestroy {
  @Input() mode: 'grid' | 'carousel' = 'grid';

  // Properties
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategories: number[] = [];
  lang: 'ar' | 'en' = 'ar';
  topSellers: any[] = [];
  allCategories: any[] = [];

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
  textDir: 'rtl' | 'ltr' = 'ltr';

  cartItems: CartItem[] = [];
  subtotal = 0;
  total = 0;
  discount = 0;

  predefinedRanges = [
    { label: '0-1000', min: 0, max: 1000, selected: false },
    { label: '1000-1500', min: 1000, max: 1500, selected: false },
    { label: '1500-2000', min: 1500, max: 2000, selected: false },
    { label: '2000-2500', min: 2000, max: 2500, selected: false },
    { label: '2500-4000', min: 2500, max: 4000, selected: false }
  ];

  compareProducts: any[] = [];
  showComparePopup = false;

  private GUEST_CART_KEY = 'guest_cart';
  private readonly SWIPE_THRESHOLD = 50;
  private resizeHandler = () => {
    this.updateVisibleCards();
    this.checkIfMobile();
  };

  touchStartX = 0;
  touchEndX = 0;

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

  // ==================== LIFECYCLE METHODS ====================

  ngOnInit(): void {
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);

    // Load categories and handle query parameters
    this.productService.getCategories().subscribe({
      next: (cats) => {
        this.allCategories = cats.map(c => ({ ...c, id: Number(c.id) }));
        this.setCategories();

        // Handle query parameters after categories are loaded
        this.route.queryParams.subscribe(params => {
          const categoryId = params['category_id'] ? Number(params['category_id']) : null;

          if (categoryId && !isNaN(categoryId)) {
            if (this.categories.some(cat => cat.id === categoryId)) {
              this.selectedCategories = [categoryId];
              this.loadProductsByCategory(categoryId);
            }
          } else {
            this.fetchProductsAndFavorites();
          }
        });
      },
      error: (err) => console.error("❌ Failed to load categories", err)
    });

    // Load top sellers
    this.productService.getTopSellers().subscribe({
      next: (products) => {
        this.topSellers = products;
      },
      error: (err) => {
        console.error('Error fetching top sellers:', err);
      }
    });

    // Initialize cart and favorites
    this.loadCart();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  // ==================== SETUP METHODS ====================

  private setupSubscriptions(): void {
    // Cart state subscription
    this.cartState.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.updateCartTotals();
      this.cdr.detectChanges();
    });

    // Favorites subscription
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

    // Language subscriptions
    this.translate.use(this.languageService.getCurrentLanguage());
    this.currentLang = this.languageService.getCurrentLanguage();

    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.textDir = lang === 'ar' ? 'rtl' : 'ltr';
      this.translate.use(lang);
      this.setInitialSlide();
      this.cdr.detectChanges();
    });
  }

  // ==================== PRODUCT METHODS ====================

  private fetchProductsAndFavorites(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = [...products];
        this.applyCombinedFilters();
        this.setCategories(this.allProducts);

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

  private loadProductsByCategory(categoryId: number): void {
    this.isLoading = true;

    this.productService.getProductsByCategory(categoryId).subscribe({
      next: products => {
        this.allProducts = [...products];
        this.filteredProducts = [...products];
        this.setCategories(this.allProducts);

        if (!this.selectedCategories.includes(categoryId)) {
          this.selectedCategories = [categoryId];
        }

        const token = localStorage.getItem('token');
        this.favoriteService.loadFavorites(token).subscribe({
          next: () => {
            this.isLoading = false;
            if (this.isMobile) {
              this.currentSlideIndex = Math.floor(this.getTotalSlides() / 2);
            } else {
              this.currentSlideIndex = 0;
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: err => {
        console.error('Failed to load products by category:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAllProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = [...products];
        this.filteredProducts = [...products];
        this.setCategories(this.allProducts);

        if (this.isMobile) {
          this.currentSlideIndex = Math.floor(this.getTotalSlides() / 2);
        } else {
          this.currentSlideIndex = 0;
        }
      },
      error: (err) => console.error("Failed to load all products:", err)
    });
  }

  // ==================== CATEGORY METHODS ====================

  private setCategories(products?: Product[]): void {
    if (products && products.length) {
      const fromProducts = this.extractUniqueCategories(products);
      const merged = [...this.allCategories, ...fromProducts];
      const unique = new Map(merged.map(c => [c.id, c]));
      this.categories = Array.from(unique.values());
    } else {
      this.categories = [...this.allCategories];
    }
  }

  private extractUniqueCategories(products: Product[]): Category[] {
    const categoryMap = new Map<number, Category>();
    products.forEach(product => {
      if (product.categories) {
        product.categories.forEach(c => {
          if (!categoryMap.has(c.id)) categoryMap.set(c.id, c);
        });
      }
    });
    return Array.from(categoryMap.values());
  }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name_ar ?? '';
  }

  trackByCategory(index: number, category: Category): number {
    return category.id;
  }

  trackByProductId(index: number, product: any): number {
    return product.id;
  }

  // ==================== FILTER METHODS ====================

  toggleCategory(categoryId: number): void {
    console.log("Toggle category:", categoryId);

    this.route.queryParams.subscribe(params => {
      if (params['category_id']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { category_id: null },
          queryParamsHandling: 'merge'
        });
      }
    }).unsubscribe();

    if (this.selectedCategories.includes(categoryId)) {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
      if (this.selectedCategories.length === 0) {
        this.fetchProductsAndFavorites();
      } else {
        this.applyCombinedFilters();
      }
    } else {
      this.selectedCategories.push(categoryId);
      if (this.selectedCategories.length === 1) {
        this.loadProductsByCategory(categoryId);
      } else {
        this.applyCombinedFilters();
      }
    }
  }

  toggleAllCategories(event: any): void {
    const isChecked = event.target.checked;

    if (isChecked) {
      this.selectedCategories = this.categories.map(cat => cat.id);
      this.fetchProductsAndFavorites();
    } else {
      this.selectedCategories = [];
      this.filteredProducts = [];
    }

    this.updateUrlWithoutCategoryParam();

    if (!isChecked) {
      this.cdr.detectChanges();
    }
  }

  areAllSelected(): boolean {
    return this.categories.length > 0 &&
           this.selectedCategories.length === this.categories.length;
  }

  clearAllCategories(): void {
    this.selectedCategories = [];
    this.applyCombinedFilters();
  }

  removeCategory(categoryId: number): void {
    this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    this.applyCombinedFilters();
  }

  filterByCategory(categoryId: number | 'all'): void {
    this.selectedCategory = categoryId;
    this.selectedCategories = [];

    if (categoryId !== 'all') {
      this.selectedCategories.push(categoryId);
    }

    this.applyCombinedFilters();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category_id: categoryId === 'all' ? null : categoryId },
      queryParamsHandling: 'merge',
    });
  }

  filterByCategorycarousel(categoryId: number | 'all'): void {
    this.selectedCategory = categoryId;

    if (categoryId === 'all') {
      this.filteredProducts = [...this.allProducts];
    } else {
      this.filteredProducts = this.allProducts.filter(p =>
        p.categories.some(c => c.id === categoryId)
      );
    }

    this.currentSlideIndex = 0;
  }

  applyCombinedFilters(): void {
    if (this.allProducts.length === 0) return;

    const q = this.searchQuery.toLowerCase().trim();

    this.filteredProducts = this.allProducts.filter(p => {
      const matchesCategory =
        this.selectedCategories.length === 0 ||
        p.categories?.some(c => this.selectedCategories.includes(c.id));

      const name = (p.name_ar ?? '').toLowerCase();
      const desc = (p.description_ar ?? '').toLowerCase();
      const matchesSearch = q === '' || name.includes(q) || desc.includes(q);

      let priceNum = 0;
      if (p.price !== null && p.price !== undefined) {
        priceNum =
          typeof p.price === 'string'
            ? parseFloat(p.price.replace(/,/g, '')) || 0
            : Number(p.price) || 0;
      }

      const selectedRanges = this.predefinedRanges.filter(r => r.selected);
      const matchesRange =
        selectedRanges.length === 0 ||
        selectedRanges.some(r => priceNum >= r.min && priceNum <= r.max);

      const meetsMin = this.priceMin == null || priceNum >= this.priceMin;
      const meetsMax = this.priceMax == null || priceNum <= this.priceMax;

      return matchesCategory && matchesSearch && matchesRange && meetsMin && meetsMax;
    });

    this.currentSlideIndex = 0;
    this.cdr.detectChanges();
  }

  filterBySearch(): void {
    this.applyCombinedFilters();
  }

  applyPriceFilter(): void {
    this.applyCombinedFilters();
  }

  applyPredefinedRange(index: number): void {
    this.predefinedRanges[index].selected = !this.predefinedRanges[index].selected;
    const selectedRanges = this.predefinedRanges.filter(r => r.selected);
    this.priceMin = selectedRanges.length > 0 ? Math.min(...selectedRanges.map(r => r.min)) : null;
    this.priceMax = selectedRanges.length > 0 ? Math.max(...selectedRanges.map(r => r.max)) : null;
    this.applyCombinedFilters();
  }

  // ==================== CART METHODS ====================

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
        cart.push(newItem);
      }

      this.saveGuestCart(cart);
      this.cartState.updateItems(cart);
      return;
    }

    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
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
      this.cartState.updateItems(cart);
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
      this.cartState.updateItems(cart);
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
      this.cartState.updateItems(cart);
      return;
    }

    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart()
    });
  }

  isInCart(product_id: number | string): boolean {
    return this.cartItems.some(i => Number(i.product_id) === Number(product_id));
  }

  getCartItem(product_id: number | string) {
    return this.cartItems.find(i => Number(i.product_id) === Number(product_id));
  }

  private modifyQuantity(product_id: number, delta: number, event?: Event): void {
    event?.stopPropagation();
    const currentItems = this.cartState['cartItemsSource'].getValue();
    const item = currentItems.find(i => i.product_id === product_id);
    if (!item) return;
    
    const newQty = item.quantity + delta;

    if (newQty > 0) {
      if (!this.isLoggedIn()) {
        item.quantity = newQty;
        this.saveGuestCart(currentItems);
        this.cartState.updateSingleItem(item);
      } else {
        this.cartService.updateQuantity(product_id, newQty).subscribe({ next: () => this.loadCart() });
      }
    } else {
      this.removeItem(product_id);
    }
  }

  // ==================== CART HELPER METHODS ====================

  private loadCart(): void {
    if (!this.isLoggedIn()) {
      const guestCart = this.loadGuestCart();
      this.cartState.updateItems(guestCart);
    } else {
      this.cartService.getCart().subscribe({
        next: (res) => {
          const items: CartItem[] = res.data.items;
          this.cartState.updateItems(items);
          this.saveGuestCart(items);
        },
        error: (err) => console.error('Failed to load user cart', err)
      });
    }
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

  private updateCartTotals(): void {
    this.subtotal = this.cartItems.reduce(
      (sum, i) => sum + ((Number(i.sale_unit_price) || Number(i.unit_price)) * i.quantity),
      0
    );
    this.total = this.subtotal - this.discount;
    const count = this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    this.cartState.updateCount(count);
  }

  private handleCartActionError(err: HttpErrorResponse): void {
    console.error('❌ Cart action failed:', err);
    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    }
  }

  private resetCartState(): void {
    this.cartItems = [];
    this.cartState.updateCount(0);
  }

  // ==================== FAVORITE METHODS ====================

  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const token = localStorage.getItem('token');

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: (res) => {
        if (!this.favoriteService.favorites$) {
          product.isFavorite = !product.isFavorite;
        }
      },
      error: (err) => console.error('Error toggling favorite:', err)
    });
  }

  // ==================== COMPARE METHODS ====================

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

  isInCompare(product: any): boolean {
    return this.compareProducts?.some(p => p.id === product.id);
  }

  // ==================== CAROUSEL METHODS ====================

  nextSlide(): void {
    const maxIndex = Math.max(0, this.getTotalSlides() - 1);
    if (this.currentSlideIndex < maxIndex) this.currentSlideIndex++;
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) this.currentSlideIndex--;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = Math.min(Math.max(index, 0), this.getTotalSlides() - 1);
  }

  getTotalSlides(): number {
    if (!this.filteredProducts) return 0;
    return Math.ceil(this.filteredProducts.length / this.visibleCards);
  }

  getDotsArray(): number[] {
    return Array.from({ length: this.getTotalSlides() }, (_, i) => i);
  }

  getActiveProductIndex(): number {
    return (this.currentSlideIndex * this.visibleCards) + Math.floor(this.visibleCards / 2);
  }

  // ==================== TOUCH HANDLERS ====================

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (Math.abs(swipeDistance) > this.SWIPE_THRESHOLD) {
      const isRTL = this.currentLang === 'ar';

      if ((swipeDistance > 0 && !isRTL) || (swipeDistance < 0 && isRTL)) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    }
  }

  // ==================== RESPONSIVE METHODS ====================

  updateVisibleCards(): void {
    if (window.innerWidth <= 768) this.visibleCards = 1;
    else if (window.innerWidth <= 1024) this.visibleCards = 2;
    else this.visibleCards = 3;
  }

  checkIfMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  // ==================== UTILITY METHODS ====================

  private setInitialSlide(): void {
    if (this.currentLang === 'ar') {
      this.currentSlideIndex = Math.max(this.getTotalSlides() - 1, 0);
    } else {
      this.currentSlideIndex = 0;
    }
  }

  private updateUrlWithoutCategoryParam(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category_id: null },
      queryParamsHandling: 'merge'
    });
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

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

  openSidebar(): void {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('filtersModal'));
    modal.show();
  }

  // تقسيم المنتجات إلى صفحات لكل 9 منتجات
getProductPages(): Product[][] {
  const perPage = 9;
  const pages: Product[][] = [];
  for (let i = 0; i < this.filteredProducts.length; i += perPage) {
    pages.push(this.filteredProducts.slice(i, i + perPage));
  }
  return pages;
}


// إضافة هذه الخصائص في الكلاس
currentPage: number = 0;
pageSize: number = 9; // 3×3 = 9 products per page

// دوال الـ Pagination
getCurrentPageProducts(): Product[] {
  const startIndex = this.currentPage * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  return this.filteredProducts.slice(startIndex, endIndex);
}

getTotalPages(): number {
  return Math.ceil(this.filteredProducts.length / this.pageSize);
}

getPagesArray(): number[] {
  return Array.from({ length: this.getTotalPages() }, (_, i) => i);
}

goToPage(page: number): void {
  if (page >= 0 && page < this.getTotalPages()) {
    this.currentPage = page;
    this.cdr.detectChanges();
  }
}

nextPage(): void {
  if (this.currentPage < this.getTotalPages() - 1) {
    this.currentPage++;
    this.cdr.detectChanges();
  }
}

prevPage(): void {
  if (this.currentPage > 0) {
    this.currentPage--;
    this.cdr.detectChanges();
  }
}

// تأكد من إعادة تعيين الصفحة عند تغيير الفلتر
// applyCombinedFilters(): void {
//   const q = this.searchQuery.toLowerCase().trim();

//   this.filteredProducts = this.allProducts.filter(p => {
//     const matchesCategory =
//       this.selectedCategories.length === 0 ||
//       p.categories?.some(c => this.selectedCategories.includes(c.id));

//     const name = (p.name_ar ?? '').toLowerCase();
//     const desc = (p.description_ar ?? '').toLowerCase();
//     const matchesSearch = q === '' || name.includes(q) || desc.includes(q);

//     let priceNum = 0;
//     if (p.price !== null && p.price !== undefined) {
//       priceNum =
//         typeof p.price === 'string'
//           ? parseFloat(p.price.replace(/,/g, '')) || 0
//           : Number(p.price) || 0;
//     }

//     const selectedRanges = this.predefinedRanges.filter(r => r.selected);
//     const matchesRange =
//       selectedRanges.length === 0 ||
//       selectedRanges.some(r => priceNum >= r.min && priceNum <= r.max);

//     const meetsMin = this.priceMin == null || priceNum >= this.priceMin;
//     const meetsMax = this.priceMax == null || priceNum <= this.priceMax;

//     return matchesCategory && matchesSearch && matchesRange && meetsMin && meetsMax;
//   });

//   // إعادة تعيين إلى الصفحة الأولى عند تغيير الفلتر
//   this.currentPage = 0;
//   this.cdr.detectChanges();
// }
}

function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}