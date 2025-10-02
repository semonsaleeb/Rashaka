import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ProductService } from '../services/product';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { FavoriteService } from '../services/favorite.service';
import { FormsModule } from '@angular/forms';
import { Downloadapp } from '../pages/home/downloadapp/downloadapp';
import { Product } from '../../models/Product';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { CartSidebar } from '../cart-sidebar/cart-sidebar';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [HttpClientModule, RouterModule, FormsModule, Downloadapp, TranslateModule, CartSidebar],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss'
})
export class Favorites implements OnInit {
  cartItems: any[] = [];
  favorites: Product[] = [];
  isLoading = true;
  private GUEST_CART_KEY = 'guest_cart';



  
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

 

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

     // Set initial language
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  /** ---------------- FAVORITES ---------------- */
  loadFavorites(): void {
    const token = localStorage.getItem('token');

    if (token) {
      // ✅ لو مسجل دخول → API
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
        }
      });
    } else {
      // ✅ Guest → localStorage
      this.favorites = this.favoriteService.getLocalFavorites();
      this.favoriteService.setFavorites(this.favorites);
      this.isLoading = false;
    }
  }

  removeFromFavorites(product: Product): void {
    const token = localStorage.getItem('token');

    if (token) {
      // API
      product.isFavorite = true; // علشان toggle يشيلها
      this.favoriteService.toggleFavorite(product, token).subscribe({
        next: () => this.loadFavorites(),
        error: (err) => console.error('Error removing favorite:', err)
      });
    } else {
      // LocalStorage
this.favoriteService.removeLocalFavorite(product.id);
      this.favorites = this.favoriteService.getLocalFavorites();
    }
  }
goToProduct(productId: number): void {
  this.router.navigate(['/product', productId]);
}

  clearAllFavorites(): void {
    const token = localStorage.getItem('token');

    if (token) {
      if (!confirm('هل أنت متأكد من مسح جميع المفضلة؟')) return;
      this.favoriteService.clearFavorites(token).subscribe({
        next: () => {
          this.favorites = [];
          this.favoriteService.setFavorites([]);
        },
        error: (err) => console.error('Error clearing favorites:', err)
      });
    } else {
      // Guest
      if (!confirm('هل أنت متأكد من مسح جميع المفضلة؟')) return;
      this.favoriteService.clearLocalFavorites();
      this.favorites = [];
      this.favoriteService.setFavorites([]);
    }
  }

  /** ---------------- CART ---------------- */
  private loadCart(): void {
    if (!this.isLoggedIn()) {
      this.cartItems = [];
      return;
    }
    this.cartService.getCart().subscribe({
      next: (response) => this.handleCartResponse(response),
      error: (err: HttpErrorResponse) => this.handleCartError(err)
    });
  }
  private loadGuestCart(): any[] {
    const storedCart = localStorage.getItem(this.GUEST_CART_KEY);
    const cart = storedCart ? JSON.parse(storedCart) : [];
    this.cartState.updateItems(cart);
    return cart;
  }
  private refreshCartCount(): void {
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

    this.cartState.updateCount(total);
  }
  private saveGuestCart(cart: any[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    this.cartState.updateItems(cart);
    this.refreshCartCount();
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
      return;
    }

   this.cartService.addToCart(product.id, 1).subscribe({
  next: (response) => {
    this.loadCart();
    this.cartState.updateItems(response.data?.items || []); // 🟢 تحديث الـ Sidebar
  },
  error: (err) => this.handleCartActionError(err)
});

  }

increaseQuantity(productId: number, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  this.cartService.addToCart(productId, 1).subscribe({
    next: (response) => {
      this.loadCart();
      this.cartState.updateItems(response.data?.items || []);
    },
    error: (err) => console.error('Error increasing quantity:', err)
  });
}

decreaseQuantity(productId: number, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  this.cartService.reduceCartItem(productId).subscribe({
    next: (response) => {
      this.loadCart();
      this.cartState.updateItems(response.data?.items || []);
    },
    error: (err) => console.error('Error decreasing quantity:', err)
  });
}


  isInCart(productId: number): boolean {
    return this.cartItems.some(item => Number(item.product_id) === Number(productId));
  }

  getCartItem(productId: number): any {
    return this.cartItems.find(item => Number(item.product_id) === Number(productId));
  }

private handleCartResponse(response: any): void {
  this.cartItems = response.data?.items || [];

  // 🟢 حدّث العناصر عشان sidebar يشوفها
  this.cartState.updateItems(this.cartItems);

  const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  this.cartState.updateCount(total);
}


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

function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}