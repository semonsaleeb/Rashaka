import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ProductService } from '../services/product';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../services/favorite.service';
import { map, Observable } from 'rxjs';
import { Downloadapp } from '../pages/home/downloadapp/downloadapp';
import { Product } from '../../models/Product';
import { CartItem } from '../../models/CartItem';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryProducts } from '../pages/home/category-products/category-products';
import { TruncatePipe } from '../truncate-pipe';
import { ComparePopup } from '../compare-popup/compare-popup';
import { CompareService } from '../services/compare-service';
declare var bootstrap: any;

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Downloadapp,
    TranslateModule,
    TruncatePipe,
    ComparePopup
  ],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCard implements OnInit {
  product!: Product;
  isLoading = true;
  errorMessage = '';
  selectedImageIndex = 0;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  Math = Math;
  showFullDescription = false;
  wordLimit = 20;
  private GUEST_CART_KEY = 'guest_cart';
  @Input() cartItems: CartItem[] = [];

  showDescription = true; 
  showReviews = false;
  
  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private auth: AuthService,
    private cartService: CartService,
    public cartState: CartStateService,
    private favoriteService: FavoriteService,
    private compareService: CompareService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // ضبط عدد الكروت المرئية حسب الشاشة
    this.updateVisibleCards();
    window.addEventListener('resize', () => this.updateVisibleCards());

    // الحصول على productId من الرابط
    this.route.paramMap.subscribe(params => {
      const productId = Number(params.get('id'));
      if (!productId || isNaN(productId)) {
        this.errorMessage = 'Invalid product ID';
        this.isLoading = false;
        return;
      }

      // تحميل المنتج
      this.loadProduct(productId);
      
      // تحميل الكارت حسب حالة تسجيل الدخول
      if (!this.isLoggedIn()) {
        this.cartItems = this.loadGuestCart();
        this.refreshCartCount();
        this.cdr.detectChanges();
      } else {
        this.loadCart();
      }
    });

    // استماع لتغييرات الكارت
    this.cartState.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cdr.detectChanges();
    });

    // متابعة تغييرات المفضلة
    this.favoriteService.favorites$.subscribe(favs => {
      const favoriteIds = new Set(favs.map(f => f.id));

      if (this.filteredProducts?.length) {
        this.filteredProducts = this.filteredProducts.map(p => ({
          ...p,
          isFavorite: favoriteIds.has(p.id)
        }));
      }

      this.cdr.detectChanges();
    });

    // متابعة تغييرات المقارنة
    this.compareService.compareProducts$.subscribe(products => {
      this.compareProducts = products;
      this.cdr.detectChanges();
    });

    // تحميل منتجات المقارنة الأولية
this.compareService.compareProducts$.subscribe(products => {
    this.compareProducts = products;
    this.cdr.detectChanges(); // تحديث view
  });  }

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

  updateVisibleCards() {
    const width = window.innerWidth;
    if (width < 576) this.visibleCards = 1;
    else if (width < 768) this.visibleCards = 2;
    else this.visibleCards = 3;
  }

  private loadProduct(productId: number): void {
    const token = localStorage.getItem('token') || '';

    this.productService.getProductById(productId, token).subscribe({
      next: (product) => {
        this.product = {
          ...product,
          average_rating: product.average_rating ?? 0,
          isFavorite: false
        };

        this.favoriteService.favorites$.subscribe(favs => {
          this.product.isFavorite = favs.some(fav => fav.id === this.product.id);
        });

        this.isLoading = false;
        this.cdr.detectChanges();

        const firstCategoryId = this.product.categories?.[0]?.id;
        if (firstCategoryId) {
          console.log("📌 Loaded product, now loading category products for categoryId:", firstCategoryId);
          this.loadCategoryProducts(firstCategoryId, token);
        } else {
          console.warn("⚠️ Product has no categories", this.product);
        }
      },
      error: (err) => {
        console.error('Error fetching product details', err);
        this.errorMessage = 'Failed to load product details';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadCategoryProducts(categoryId: number, token: string = ''): void {
    console.log("📌 Loading category products for categoryId:", categoryId);

    this.productService.getProductsByCategory(categoryId, token).subscribe({
      next: (response: any) => {
        console.log("📦 Raw API Response:", response);

        let products: Product[] = [];
        
        if (Array.isArray(response)) {
          products = response;
        } else if (response?.data && Array.isArray(response.data)) {
          products = response.data;
        } else if (response?.data?.products && Array.isArray(response.data.products)) {
          products = response.data.products;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          products = response.data.data;
        } else {
          console.warn("⚠️ Unexpected API structure:", response);
          products = [];
        }

        console.log("📦 Parsed Products:", products);

        if (this.product?.id) {
          this.filteredProducts = products.filter(p => p.id !== this.product.id);
        } else {
          this.filteredProducts = products;
        }

        console.log("✅ Filtered Category Products:", this.filteredProducts.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("❌ Error loading category products:", err);
        this.filteredProducts = [];
        this.cdr.detectChanges();
      }
    });
  }

  getProductById(id: number, token: string): Observable<Product> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    });

    const url = `${environment.apiBaseUrl}/products?product_id=${id}`;

    return this.http.get<{ status: string; data: Product[] }>(url, { headers }).pipe(
      map(response => {
        const found = response.data.find(p => p.id === id);
        if (!found) throw new Error(`Product with ID ${id} not found`);
        return found;
      })
    );
  }

  addToCart(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const existing = cart.find(i => i.product_id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          product_id: product.id,
          quantity: 1,
          product_name_ar: product.name_ar,
          product_name: product.name,
          unit_price: safeNumber(product.price_before || product.price || product.original_price),
          sale_unit_price: safeNumber(product.price_after || product.price || product.sale_price),
          images: product.images || []
        });
      }

      this.saveGuestCart(cart);
      setTimeout(() => this.openCartSidebar(), 50);
      return;
    }

    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.loadCart();
        setTimeout(() => this.openCartSidebar(), 50);
      },
      error: (err) => this.handleCartActionError(err)
    });
  }

  openCartSidebar(): void {
    const sidebarEl = document.getElementById('cartSidebar');
    if (sidebarEl) {
      const offcanvas = bootstrap.Offcanvas.getInstance(sidebarEl)
        || new bootstrap.Offcanvas(sidebarEl);

      if (!this.isLoggedIn()) {
        const cart = this.loadGuestCart();
        this.cartState.updateItems(cart);
        this.cartState.updateCount(
          cart.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
        );
        this.cdr.detectChanges();
      } else {
        this.cartService.getCart().subscribe({
          next: (response) => {
            const items = response.data?.items || [];
            this.cartState.updateItems(items);
            this.cartState.updateCount(
              items.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0)
            );
            this.cdr.detectChanges();
          },
          error: (err) => this.handleCartActionError(err)
        });
      }

      offcanvas.show();
    }
  }

  private handleCartResponse(response: any): void {
    this.cartItems = response.data?.items || [];
    this.cartState.updateItems(this.cartItems);

    const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(total);
  }

   increaseQuantity(productId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) {
        item.quantity++;
      }
      this.saveGuestCart(cart);
      return;
    }

    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart()
    });
  }

  decreaseQuantity(productId: number, event?: Event): void {
    event?.stopPropagation();

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

  private loadGuestCart(): any[] {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    const parsedCart = cart ? JSON.parse(cart) : [];
    console.log("🛒 Guest Cart Loaded:", parsedCart);
    return parsedCart;
  }

  private saveGuestCart(cart: any[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    console.log("💾 Guest Cart Saved:", cart);

    this.cartState.updateItems(cart);
    this.cartItems = cart;
    this.refreshCartCount();
  }

  private loadCart(): void {
    if (!this.isLoggedIn()) {
      this.cartItems = this.loadGuestCart();
      this.refreshCartCount();
      return;
    }

    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data?.items || [];
        this.refreshCartCount();
        this.cdr.detectChanges();
      },
      error: (err) => this.handleCartActionError(err)
    });
  }

  private handleCartActionError(err: HttpErrorResponse): void {
    console.error('❌ Cart action failed:', err);

    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    } else {
      alert('⚠️ فشل تنفيذ العملية. حاول مرة أخرى.');
    }
  }

  private resetCartState(): void {
    this.cartItems = [];
    this.cartState.updateCount(0);
  }

  refreshCartCount(): void {
    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const count = cart.reduce((total, item) => total + (item.quantity ?? 0), 0);
      this.cartState.updateCount(count);
      return;
    }

    this.cartService.getCart().subscribe(response => {
      const count = response.data.items.reduce((total: number, item: any) => total + item.quantity, 0);
      this.cartState.updateCount(count);
    });
  }

  get shortDescription(): string {
    const desc = this.product?.description_ar || this.product?.description || '';
    const words = desc.split(' ');
    return words.slice(0, this.wordLimit).join(' ');
  }

  get hasMore(): boolean {
    const desc = this.product?.description_ar || this.product?.description || '';
    return desc.split(' ').length > this.wordLimit;
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  getFullStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getHalfStar(rating: number): boolean {
    return rating % 1 !== 0;
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.ceil(rating)).fill(0);
  }

  isInCart(productId: number): boolean {
    return this.cartItems.some(item => item.product_id === productId);
  }

  getCartItem(product_id: number | string) {
    return this.cartItems.find(i => Number(i.product_id) === Number(product_id));
  }

  // 🔧 الإصلاح الرئيسي: استخدام CompareService بدلاً من localStorage مباشرة
// ✅ إضافة منتج للمقارنة
addToCompare(product: Product, event?: Event): void {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // استدعاء الـ Service لإضافة المنتج
  this.compareService.addToCompare(product);

  // تحديث الـ popup حسب عدد المنتجات
  const products = this.compareService.getCompareProducts();
  if (products.length === 2) {
    this.showComparePopup = true;
  }
}

// ✅ التحقق إذا المنتج موجود في المقارنة
isInCompare(product: Product): boolean {
  return this.compareService.getCompareProducts().some(p => p.id === product.id);
}

// ✅ إغلاق نافذة المقارنة وتفريغ القائمة
onCloseComparePopup(): void {
  this.showComparePopup = false;
  this.compareService.clearCompare();
}



  // استخدام CompareService للتحميل
  // private loadCompareProducts(): void {
  //   this.compareProducts = this.compareService.getCompareProducts();
  // }

// isInCompare(product: Product): boolean {
//   return this.compareProducts.some(p => p.id === product.id);
// }


//   onCloseComparePopup(): void {
//     this.showComparePopup = false;
//     this.compareService.clearCompare(); // تنظيف المقارنة بعد إغلاق البوب أب
//   }

  // خصائص الكاروسيل
  currentLang: string = 'ar';
  currentSlideIndex = 0;
  visibleCards = 3;
  filteredProducts: Product[] = [];
  compareProducts: Product[] = [];
  showComparePopup = false;

  touchStartX = 0; 
  touchEndX = 0;
  
  onTouchStart(event: TouchEvent) { 
    this.touchStartX = event.changedTouches[0].screenX; 
  }
  
  onTouchEnd(event: TouchEvent) { 
    this.touchEndX = event.changedTouches[0].screenX; 
    this.handleSwipe(); 
  }
  
  nextSlide(): void { 
    const maxIndex = Math.max(0, this.getTotalSlides() - 1); 
    if (this.currentSlideIndex < maxIndex) this.currentSlideIndex++; 
  }
  
  prevSlide(): void { 
    if (this.currentSlideIndex > 0) this.currentSlideIndex--; 
  }
  
  getTotalSlides(): number {
    if (!this.filteredProducts) return 0;
    return Math.ceil(this.filteredProducts.length / this.visibleCards);
  }
  
  getDotsArray(): number[] { 
    return Array.from({ length: this.getTotalSlides() }, (_, i) => i); 
  }
  
  goToSlide(index: number) { 
    this.currentSlideIndex = Math.min(Math.max(index, 0), this.getTotalSlides() - 1); 
  }
  
  textDir: 'rtl' | 'ltr' = 'ltr';
  private readonly SWIPE_THRESHOLD = 50;

  handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (Math.abs(swipeDistance) > 50) {
      const isRTL = this.currentLang === 'ar';

      if ((swipeDistance > 0 && !isRTL) || (swipeDistance < 0 && isRTL)) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    }
  }
}

function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}