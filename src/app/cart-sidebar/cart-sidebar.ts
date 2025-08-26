import { ChangeDetectorRef, Component, Input, NgZone } from '@angular/core';
import { CartItem } from '../../models/CartItem';
import { ProductService } from '../services/product';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../services/favorite.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-sidebar.html',
  styleUrl: './cart-sidebar.scss'
})
export class CartSidebar {
  @Input() cartItems: CartItem[] = [];
  private GUEST_CART_KEY = 'guest_cart';
  progressValue = 80;
  isLoading = true;

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

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }
  private loadGuestCart(): any[] {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  private saveGuestCart(cart: any[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    this.cartItems = cart; // ⬅️ تحديث مباشر
    this.refreshCartCount();
  }
  private refreshCartCount(): void {
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

    this.cartState.updateCount(total);
  }

  private loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data?.items || [];
        this.refreshCartCount();
      },
      error: (err) => this.handleCartError(err)
    });
  }


  private handleCartError(err: HttpErrorResponse): void {
    console.error('❌ Error loading cart:', err);
    if (err.status === 401) this.auth.logout();
    this.resetCartState();
    this.isLoading = false;
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

  closeSidebar(): void {
    const sidebarEl = document.getElementById('cartSidebar');
    if (sidebarEl) {
      const offcanvas = bootstrap.Offcanvas.getInstance(sidebarEl)
        || new bootstrap.Offcanvas(sidebarEl);
      offcanvas.hide();
    }
  }


}


