import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ProductService } from '../services/product';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';
import { FavoriteService } from '../services/favorite.service';
import { FormsModule } from '@angular/forms';
import { Downloadapp } from '../pages/home/downloadapp/downloadapp';
import { Product } from '../../models/Product';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { CartSidebar } from '../cart-sidebar/cart-sidebar';
import { CartStateService } from '../services/cart-state-service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    HttpClientModule,
    RouterModule,
    FormsModule,
    Downloadapp,
    TranslateModule,
  ],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites implements OnInit {
  cartItems: any[] = [];
  favorites: Product[] = [];
  isLoading = true;
  private GUEST_CART_KEY = 'guest_cart';

  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    public router: Router,
    private cartService: CartService,
    public cartState: CartStateService,
    private favoriteService: FavoriteService,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.loadCart();

    // إعداد اللغة
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    this.languageService.currentLang$.subscribe((lang) => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  /** ---------------- FAVORITES ---------------- */
  loadFavorites(): void {
    const token = localStorage.getItem('token');

    if (token) {
      this.favoriteService.loadFavorites(token).subscribe({
        next: (favorites) => {
          this.favorites = favorites;
          this.favoriteService.setFavorites(favorites);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading favorites:', err);
          this.isLoading = false;
          if (err.status === 401) this.auth.logout();
        },
      });
    } else {
      this.favorites = this.favoriteService.getLocalFavorites();
      this.favoriteService.setFavorites(this.favorites);
      this.isLoading = false;
    }
  }

  removeFromFavorites(product: Product): void {
    const token = localStorage.getItem('token');

    if (token) {
      product.isFavorite = true;
      this.favoriteService.toggleFavorite(product, token).subscribe({
        next: () => this.loadFavorites(),
        error: (err) => console.error('Error removing favorite:', err),
      });
    } else {
      this.favoriteService.removeLocalFavorite(product.id);
      this.favorites = this.favoriteService.getLocalFavorites();
    }
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  clearAllFavorites(): void {
    const token = localStorage.getItem('token');
    if (!confirm('هل أنت متأكد من مسح جميع المفضلة؟')) return;

    if (token) {
      this.favoriteService.clearFavorites(token).subscribe({
        next: () => {
          this.favorites = [];
          this.favoriteService.setFavorites([]);
        },
        error: (err) => console.error('Error clearing favorites:', err),
      });
    } else {
      this.favoriteService.clearLocalFavorites();
      this.favorites = [];
      this.favoriteService.setFavorites([]);
    }
  }

  /** ---------------- CART ---------------- */
  private loadCart(): void {
    if (!this.isLoggedIn()) {
      this.cartItems = this.loadGuestCart();
      return;
    }
    this.cartService.getCart().subscribe({
      next: (response) => this.handleCartResponse(response),
      error: (err: HttpErrorResponse) => this.handleCartError(err),
    });
  }

  private loadGuestCart(): any[] {
    const storedCart = localStorage.getItem(this.GUEST_CART_KEY);
    const cart = storedCart ? JSON.parse(storedCart) : [];
    this.cartState.updateItems(cart);
    return cart;
  }

private saveGuestCart(cart: any[]): void {
  localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
  this.cartState.updateItems(cart);
  this.cartItems = cart; // ✅ Update component data too
  this.refreshCartCount();
}


  getDisplayedPrices(product: Product) {
    const isLoggedIn = this.isLoggedIn();
    if (isLoggedIn) {
      return {
        current: product.price_after ?? product.sale_price ?? product.price,
        old: product.price_before ?? product.original_price ?? null,
      };
    }

    return {
      current: product.sale_price ?? product.price_after ?? product.price,
      old: product.original_price ?? product.price_before ?? null,
    };
  }

  /** ✅ إضافة منتج للكارت */
  addToCart(product: Product, event?: Event): void {
    event?.stopPropagation();

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const existing = cart.find((i) => i.product_id === product.id);

      if (existing) {
        existing.quantity++;
      } else {
        const basePrice = safeNumber(
          product.price_before ?? product.price ?? product.original_price
        );
        const offerPrice = safeNumber(
          product.price_after ?? product.sale_price ?? 0
        );
        const hasOffer = offerPrice > 0 && offerPrice < basePrice;

        const cartItem: any = {
          product_id: product.id,
          quantity: 1,
          product_name_ar: product.name_ar,
          product_name: product.name,
          unit_price: basePrice,
          images: product.images || [],
        };

        if (hasOffer) {
          cartItem.sale_unit_price = offerPrice;
        }

        cart.push(cartItem);
      }

      this.saveGuestCart(cart);
      this.cartItems = this.loadGuestCart();
      return;
    }

    this.cartService.addToCart(product.id, 1).subscribe({
      next: (response) => {
        this.loadCart();
        this.cartState.updateItems(response.data?.items || []);
      },
      error: (err) => this.handleCartActionError(err),
    });
  }

  /** ✅ زيادة الكمية */
  increaseQuantity(productId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const item = cart.find((i) => i.product_id === productId);
      if (item) item.quantity++;
      this.saveGuestCart(cart);
      return;
    }

    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
    });
  }

decreaseQuantity(productId: number, event?: Event): void {
  event?.stopPropagation();

  if (!this.isLoggedIn()) {
    let cart = this.loadGuestCart();
    const item = cart.find(i => i.product_id === productId);

    if (item) {
      item.quantity--;

      // 🔹 Remove the item completely if quantity reaches 0
      if (item.quantity <= 0) {
        cart = cart.filter(i => i.product_id !== productId);
      }
    }

    // 🔹 Save updated guest cart
    this.saveGuestCart(cart);

    // ✅ تحديث الكارت في الحالة (State)
    this.cartState.updateItems(cart);
    this.cartState.updateCount(cart.reduce((sum, i) => sum + (i.quantity || 0), 0));

    // ✅ تحديث الـ cartItems عشان الواجهة تتحدث فورًا
    this.cartItems = [...cart];

    return;
  }

  // 🔹 For logged-in users (API call)
  this.cartService.reduceCartItem(productId).subscribe({
    next: () => {
      // 🔹 إعادة تحميل الكارت من الـ API
      this.loadCart();

      // ✅ تحديث الحالة بعد الحذف مباشرة
      const current = this.cartState.getCartSummary().items.filter(i => i.product_id !== productId || i.quantity > 0);
      this.cartState.updateItems(current);
      this.cartState.updateCount(current.reduce((sum, i) => sum + (i.quantity || 0), 0));
    },
    error: (err) => {
      console.error('Error decreasing quantity:', err);
      if (err.status === 401) {
        this.auth.logout();
        this.router.navigate(['/auth/login']);
      }
    }
  });
}



  /** ✅ حذف منتج من الكارت */
  removeItem(productId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart().filter(
        (i) => i.product_id !== productId
      );
      this.saveGuestCart(cart);
      return;
    }

    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart(),
    });
  }

  /** ✅ عدد القطع الحالية للمنتج */
  private getCurrentQuantity(productId: number): number {
    const current = this.cartState.getCartSummary().items;
    const item = current.find((i) => i.product_id === productId);
    return item ? item.quantity : 0;
  }

  private refreshCartCount(): void {
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

    this.cartState.updateCount(total);
  }

isInCart(productId: number): boolean {
  const currentCart = this.cartState.getCartSummary().items;
  return currentCart.some(item => item.product_id === productId);
}


  getCartItem(productId: number) {
    return this.cartState
      .getCartSummary()
      .items.find((i) => i.product_id === productId);
  }

  /** ✅ معالجة استجابة الكارت */
  private handleCartResponse(response: any): void {
    this.cartItems = response.data?.items || [];
    this.cartState.updateItems(this.cartItems);

    const total = this.cartItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    this.cartState.updateCount(total);
  }

  /** ✅ أخطاء الكارت */
  private handleCartError(err: HttpErrorResponse): void {
    console.error('Error loading cart:', err);
    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    } else {
      this.resetCartState();
    }
  }

  private handleCartActionError(err: HttpErrorResponse): void {
    console.error('Cart action failed:', err);
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

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }
}

/** 🔹 Helper: لتحويل أي قيمة رقمية */
function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}
