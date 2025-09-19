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
declare var bootstrap: any;

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Downloadapp
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
  // 1️⃣ استمع لأي تغيير في الـ route params
  this.route.paramMap.subscribe(params => {
    const productId = Number(params.get('id'));

    if (!productId || isNaN(productId)) {
      this.errorMessage = 'Invalid product ID';
      this.isLoading = false;
      return;
    }

    // 2️⃣ حمل المنتج باستخدام function منفصلة
    this.loadProduct(productId);

    // 3️⃣ لو المستخدم guest، حمل cart من localStorage
    if (!this.isLoggedIn()) {
      this.cartItems = this.loadGuestCart();
      this.refreshCartCount();
      this.cdr.detectChanges();
    } else {
      // logged-in → حمل الكارت من API
      this.loadCart();
    }
  });
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

      // 🟢 تحديث حالة المفضلة
      this.favoriteService.favorites$.subscribe(favs => {
        this.product.isFavorite = favs.some(fav => fav.id === this.product.id);
      });

      console.log('Loaded product:', this.product);
      this.isLoading = false;

      // 🔹 أخيراً، detect changes
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error fetching product details', err);
      this.errorMessage = 'Failed to load product details';
      this.isLoading = false;
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

    const unitPrice = safeNumber(product.price_before ?? product.price ?? product.original_price ?? 0);
    const saleUnitPrice = safeNumber(product.price_after ?? product.sale_price ?? 0);
    const finalPrice = saleUnitPrice > 0 ? saleUnitPrice : unitPrice;

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const existing = cart.find(i => i.product_id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          product_id: product.id,
          product_name: product.name ?? 'منتج بدون اسم',
          product_name_ar: product.name_ar ?? 'منتج بدون اسم',
          quantity: 1,
          unit_price: unitPrice,
          sale_unit_price: saleUnitPrice || unitPrice,
          final_price: finalPrice,
          images: product.images ?? []
        });
      }

      this.saveGuestCart(cart);

      // 🟢 افتح الـ sidebar بعد إضافة المنتج
      this.openCartSidebar();
      return;
    }

    // Logged-in user → API
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.loadCart();
        this.openCartSidebar(); // 🟢 فتح الـ sidebar
      },
      error: (err) => this.handleCartActionError(err)
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
  openCartSidebar(): void {
    const sidebarEl = document.getElementById('cartSidebar');
    if (sidebarEl) {
      const offcanvas = bootstrap.Offcanvas.getInstance(sidebarEl)
        || new bootstrap.Offcanvas(sidebarEl);

      offcanvas.show();
    }
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

  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const token = localStorage.getItem('token');

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: () => {
        // مفيش داعي لأي حاجة هنا
        // الـ favorites$ هيتحدث تلقائي
      },
      error: (err) => console.error('Error toggling favorite:', err)
    });
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
}
function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, '')); // 🟢 يشيل الكوما
  }
  return Number(value);
}
