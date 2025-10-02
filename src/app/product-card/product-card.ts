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
  selectedImageIndex = 0; // أول صورة افتراضياً
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  Math = Math;
  showFullDescription = false;
  wordLimit = 20;
  private GUEST_CART_KEY = 'guest_cart';
  @Input() cartItems: CartItem[] = [];

  showDescription = true; showReviews = false;
  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private auth: AuthService,
    private cartService: CartService,
    public cartState: CartStateService,
    private favoriteService: FavoriteService,
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

  // متابعة تغييرات المفضلة بطريقة آمنة
  this.favoriteService.favorites$.subscribe(favs => {
    const favoriteIds = new Set(favs.map(f => f.id));

    // تحديث allProducts فقط لو موجودة
    // if (this.allProducts?.length) {
    //   this.allProducts = this.allProducts.map(p => ({
    //     ...p,
    //     isFavorite: favoriteIds.has(p.id)
    //   }));
    // }

    // تحديث filteredProducts فقط لو موجودة
    if (this.filteredProducts?.length) {
      this.filteredProducts = this.filteredProducts.map(p => ({
        ...p,
        isFavorite: favoriteIds.has(p.id)
      }));
    }

    this.cdr.detectChanges();
  });
}


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
      // ✅ احفظ المنتج مع defaults
      this.product = {
        ...product,
        average_rating: product.average_rating ?? 0,
        isFavorite: false
      };

      // ✅ حدث حالة المفضلة
      this.favoriteService.favorites$.subscribe(favs => {
        this.product.isFavorite = favs.some(fav => fav.id === this.product.id);
      });

      this.isLoading = false;
      this.cdr.detectChanges();

      // ✅ حمّل منتجات نفس الكاتيجوري إذا موجود
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
      
      // معالجة مختلف هياكل الاستجابة
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

      // استبعاد المنتج الحالي وعرض الباقي
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

    // 🟢 افتح الـ sidebar بعد تحديث البيانات
    setTimeout(() => this.openCartSidebar(), 50);
    return;
  }

  this.cartService.addToCart(product.id, 1).subscribe({
    next: () => {
      this.loadCart();
      setTimeout(() => this.openCartSidebar(), 50); // 🟢 بعد التحميل افتح
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
      // 🟢 لو Guest → هات من localStorage
      const cart = this.loadGuestCart();
      this.cartState.updateItems(cart);
      this.cartState.updateCount(
        cart.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
      );
      this.cdr.detectChanges();
    } else {
      // 🟢 لو Logged-in → هات من الـ API
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

    // ✅ افتح الـ Sidebar بعد تحديث البيانات
    offcanvas.show();
  }
}



private handleCartResponse(response: any): void {
  this.cartItems = response.data?.items || [];

  // 🟢 حدّث العناصر عشان sidebar يشوفها
  this.cartState.updateItems(this.cartItems);

  const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  this.cartState.updateCount(total);
}




increaseQuantity(productId: number): void {
  if (!this.isLoggedIn()) {
    const cart = this.loadGuestCart();
    const item = cart.find(i => i.product_id === productId);
    if (item) {
      item.quantity++;
    }
    this.saveGuestCart(cart);
    this.cartState.updateItems(cart); // 🟢 Sync UI
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
    this.cartState.updateItems(cart); // 🟢 Sync UI
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
    this.cartState.updateItems(cart); // 🟢 Sync UI
    return;
  }

  this.cartService.removeCartItem(productId).subscribe({
    next: () => this.loadCart()
  });
}



  // ✅ تحميل الكارت للـ guest
  private loadGuestCart(): any[] {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    const parsedCart = cart ? JSON.parse(cart) : [];

    console.log("🛒 Guest Cart Loaded:", parsedCart);
    return parsedCart;
  }

  // ✅ حفظ الكارت للـ guest
  private saveGuestCart(cart: any[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    console.log("💾 Guest Cart Saved:", cart);

    this.cartState.updateItems(cart);
    this.cartItems = cart;
    this.refreshCartCount();
  }

  // ✅ تحميل الكارت من الـ API (لو المستخدم عامل تسجيل دخول)
  private loadCart(): void {
    if (!this.isLoggedIn()) {
      // load guest cart instead
      this.cartItems = this.loadGuestCart();
      this.refreshCartCount();
      return;
    }

    // Logged-in user → API
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data?.items || [];
        this.refreshCartCount();
        this.cdr.detectChanges();
      },
      error: (err) => this.handleCartActionError(err)
    });
  }


  // ✅ التعامل مع errors في الـ Cart Actions
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

  // toggleFavorite(product: Product, event?: Event): void {
  //   event?.stopPropagation();
  //   event?.preventDefault();

  //   const token = localStorage.getItem('token');

  //   this.favoriteService.toggleFavorite(product, token).subscribe({
  //     next: () => {
  //       // مفيش داعي لأي حاجة هنا
  //       // الـ favorites$ هيتحدث تلقائي
  //     },
  //     error: (err) => console.error('Error toggling favorite:', err)
  //   });
  // }




  getFullStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getHalfStar(rating: number): boolean {
    return rating % 1 !== 0;
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.ceil(rating)).fill(0);
  }



// ✅ هل المنتج موجود في الكارت؟
isInCart(productId: number): boolean {
  return this.cartItems.some(item => item.product_id === productId);
}

// ✅ الحصول على العنصر من الكارت
// getCartItem(productId: number) {
//   return this.cartItems.find(i => i.product_id == productId);
// }

  getCartItem(product_id: number | string) {
    return this.cartItems.find(i => Number(i.product_id) === Number(product_id));
  }

// // ✅ زيادة الكمية
// increaseQuantity(productId: number) {
//   const item = this.getCartItem(productId);
//   if (item) {
//     item.quantity += 1;
//   }
// }

// // ✅ تقليل الكمية (ولو بقت 0 بيتشال من الكارت)
// decreaseQuantity(productId: number) {
//   const item = this.getCartItem(productId);
//   if (item) {
//     item.quantity -= 1;
//     if (item.quantity <= 0) {
//       this.removeItem(productId);
//     }
//   }
// }

// // ✅ حذف المنتج بالكامل من الكارت
// removeItem(productId: number) {
//   this.cartItems = this.cartItems.filter(item => item.product_id !== productId);
// }
  currentLang: string = 'ar';
  currentSlideIndex = 0;
  visibleCards = 3;
  filteredProducts: Product[] = [];
  compareProducts: any[] = [];
  showComparePopup = false;


addToCompare(product: Product, event?: Event): void {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const productId = Number(product.id); // تحويل للرقم

  // تحقق من وجود المنتج مسبقاً
  if (this.compareProducts.find(p => Number(p.id) === productId)) {
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


isInCompare(product: any): boolean {
  return this.compareProducts?.some(p => p.id === product.id);
}


}
function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, '')); // 🟢 يشيل الكوما
  }
  return Number(value);
}
