import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Product, ProductService, Category } from '../../../services/product';
import { CartItem, CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { AuthService } from '../../../services/auth.service';
import { Downloadapp } from '../downloadapp/downloadapp';
import { FavoriteService } from '../../../services/favorite.service';
import { ComparePopup } from '../../../compare-popup/compare-popup';
import { CartViewItem } from '../../../../models/CartViewItem';

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

  cartItems: any[] = [];
  subtotal: number = 0;
  total: number = 0;
  discount: number = 0;

  predefinedRanges = [
    { label: '0-1000', min: 0, max: 1000, selected: false },
    { label: '1000-1500', min: 1000, max: 1500, selected: false },
    { label: '1500-2000', min: 1500, max: 2000, selected: false },
    { label: '2000-2500', min: 2000, max: 2500, selected: false }
  ];

  private resizeHandler = () => {
    this.updateVisibleCards();
    this.checkIfMobile();
  };

  compareProducts: any[] = [];
  showComparePopup = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public cartState: CartStateService,
    private auth: AuthService,
    private router: Router,
    private favoriteService: FavoriteService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  // ---------- lifecycle ----------
  ngOnInit(): void {
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);

    this.fetchProductsAndFavorites();
    this.loadCart();

    // ✅ تحديث السلة عند فتح الـ offcanvas
    const offcanvasEl = document.getElementById('cartSidebar');
    if (offcanvasEl) {
      offcanvasEl.addEventListener('shown.bs.offcanvas', () => {
        this.loadCart();   // يجيب أحدث نسخة من cartItems
      });
    }
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

    this.productService.getProducts().subscribe({
      next: (products) => {
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
              this.allProducts = products.map(p => ({ ...p, isFavorite: false }));
              this.filteredProducts = [...this.allProducts];
              this.categories = this.extractUniqueCategories(this.allProducts);
              this.isLoading = false;
            }
          });
        } else {
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
      this.priceMin = Math.min(...selectedRanges.map(r => r.min));
      this.priceMax = Math.max(...selectedRanges.map(r => r.max));
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

  // ---------- auth ----------
  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        localStorage.clear(); // ✅ clear everything
        this.router.navigate(['/auth']).then(() => window.location.reload());
      },
      error: (err) => {
        console.error('Logout failed', err);
        localStorage.clear(); // ✅ even on error
        this.router.navigate(['/auth']).then(() => window.location.reload());
      }
    });
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
      error: err => console.error('Error updating favorite:', err)
    });
  }

  private resizeListener = this.updateVisibleCards.bind(this);
  private GUEST_CART_KEY = 'guest_cart';

  // ✅ handle error
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

  // ✅ Guest Cart Helpers
  private loadGuestCart(): CartViewItem[] {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  saveGuestCart(cart: CartViewItem[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    this.cartItems = [...cart];
    this.cdr.detectChanges();
  }


  
  logGuestCartBeforeOpen(): void {
    const cart = this.loadGuestCart();
    console.log("📥 Guest cart BEFORE opening offcanvas:", cart);
  }

  // 2️⃣ Function to log guest cart after opening offcanvas
  logGuestCartAfterOpen(): void {
    const offcanvasEl = document.getElementById('cartSidebar');
    if (offcanvasEl) {
      offcanvasEl.addEventListener('shown.bs.offcanvas', () => {
        const cart = this.loadGuestCart();
        console.log("📤 Guest cart AFTER opening offcanvas:", cart);
        this.loadCart(); // refresh cart UI if needed
      });
    }
  }


  trackByProductId(index: number, product: any) {
    return product.id;
  }




  private refreshCartCount(): void {
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

    this.cartState.updateCount(total);
  }

  // ✅ تحديث الإجماليات
  private updateCartTotals(): void {
    this.subtotal = this.cartItems.reduce(
      (sum, item) => sum + (item.sale_unit_price || item.unit_price) * item.quantity,
      0
    );
    this.total = this.subtotal - this.discount;
    const count = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.cartState.updateCount(count);
  }

  // ---- addToCart

  addToCart(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log("🛒 addToCart called with product:", product);

    if (!this.isLoggedIn()) {
      let cart: CartViewItem[] = this.loadGuestCart();
      console.log("📦 Current guest cart before add:", cart);

      const existing = cart.find(item => item.product_id === product.id);

      const unitPrice = Number(product.price_before) || Number(product.price) || 0;
      const saleUnitPrice = Number(product.price_after) || Number(product.sale_price) || 0;

      if (existing) {
        existing.quantity += 1;
        existing.finalPrice = existing.quantity * (existing.sale_unit_price || existing.unit_price);
        console.log("🔄 Updated existing item:", existing);
      } else {
        const newItem: CartViewItem = {
          id: Date.now(),
          product_id: product.id,
          name: product.name,
          product_name_ar: product.name_ar,
          nameAr: product.name_ar,
          quantity: 1,
          price: String(unitPrice),
          unit_price: unitPrice,
          sale_unit_price: saleUnitPrice,
          sale_price: String(saleUnitPrice),
          finalPrice: saleUnitPrice,
          images: product.images || []
        };
        cart.push(newItem);
        console.log("✨ Added new item:", newItem);
      }

      // ✅ نخلي التحديث يحصل جوه Angular Zone + نعمل detectChanges
      this.ngZone.run(() => {
        this.saveGuestCart(cart);
        this.cartItems = [...cart];   // نسخة جديدة عشان Angular يdetect التغيير
        this.updateCartTotals();
        this.cdr.detectChanges();     // ✅ يجبر UI يتحدث فورًا
      });

      return;
    }

    // ✅ لو المستخدم مسجل دخول
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        console.log("✅ Product added to API cart:", product.id);
        this.loadCart();
      },
      error: (err) => this.handleCartActionError(err)
    });
  }



  // ---- loadCart
  loadCart(): void {
    if (!this.isLoggedIn()) {
      this.cartItems = this.loadGuestCart();
      console.log("📥 Loaded guest cart:", this.cartItems);
      this.updateCartTotals();
      return;
    }

    this.cartService.getCart().subscribe({
      next: (response) => {
        console.log("📥 API cart response:", response);
        this.handleCartResponse(response);
        this.updateCartTotals();
      },
      error: (err) => this.handleCartActionError(err)
    });
  }

  // ---- handleCartResponse (تحويل CartItem -> CartViewItem)
private handleCartResponse(response: any): void {
  const items = Array.isArray(response.data?.cartItems) ? response.data.cartItems : [];

  this.cartItems = items.map((item: CartItem) => {
    const unitPrice = Number(item.price) || 0;
    const salePrice = Number(item.sale_price);
    const finalUnitPrice = !isNaN(salePrice) && salePrice > 0 ? salePrice : unitPrice;

    return {
      id: item.id,
      product_id: item.product_id,
      name: item.product_name || item.name || '',
      product_name_ar: item.product_name_ar || item.name_ar || '',
      nameAr: item.name_ar || '',
      quantity: item.quantity,
      unit_price: unitPrice,
      sale_unit_price: finalUnitPrice,
      finalPrice: Number(item.final_price) || 0,
      images: item.image ? [item.image] : []
    };
  });

  console.log("🔄 handleCartResponse mapped items:", this.cartItems);
}



  // ✅ إزالة منتج
  removeItem(productId: number, event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    if (!this.isLoggedIn()) {
      let cart = this.loadGuestCart().filter(i => i.product_id !== productId);
      this.saveGuestCart(cart);
      this.loadCart();
      return;
    }

    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: (err) => this.handleCartActionError(err)
    });
  }

  // ✅ زيادة الكمية
  increaseQuantity(productId: number, event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    if (!this.isLoggedIn()) {
      let cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) {
        item.quantity += 1;
        item.finalPrice = item.quantity * (item.sale_unit_price || item.unit_price);
      }
      this.saveGuestCart(cart);
      this.loadCart();
      return;
    }

    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: (err) => this.handleCartActionError(err)
    });
  }

  // ✅ تقليل الكمية
  decreaseQuantity(productId: number): void {
    if (!this.isLoggedIn()) {
      let cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) cart = cart.filter(i => i.product_id !== productId);
        else item.finalPrice = item.quantity * (item.sale_unit_price || item.unit_price);
      }
      this.saveGuestCart(cart);
      this.loadCart();
      return;
    }

    this.cartService.reduceCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: (err) => this.handleCartActionError(err)
    });
  }

  // ✅ مساعدات
  isInCart(productId: number): boolean {
    return this.cartItems.some(item => item.product_id === productId);
  }

  getCartItem(productId: number) {
    return this.cartItems.find(item => item.product_id === productId);
  }



  // ---------- compare ----------
  addToCompare(product: any) {
    if (this.compareProducts.find(p => p.id === product.id)) return;
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

  // ---------- swipe ----------
  touchStartX = 0;
  touchEndX = 0;


  // لمس البداية
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  // لمس النهاية → يتحدد الاتجاه
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  // معالجة السحب
  handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  // التالي
  nextSlide(): void {
    const maxIndex = Math.max(0, this.getTotalSlides() - 1);
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex++;
    }
  }

  // السابق
  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  // عدد السلايدز الكلي
  getTotalSlides(): number {
    const per = Math.max(1, this.visibleCards);
    return Math.max(1, Math.ceil(this.filteredProducts.length / per));
  }

  // الدوائر (Dots) 
  getDotsArray(): number[] {
    const slideCount = this.getTotalSlides();
    return Array.from({ length: slideCount }, (_, i) => i);
  }

  // الانتقال المباشر لسلّايد
  goToSlide(index: number): void {
    const maxIndex = Math.max(0, this.getTotalSlides() - 1);
    this.currentSlideIndex = Math.min(Math.max(index, 0), maxIndex);
  }


  openSidebar() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('filtersModal'));
    modal.show();
  }
}