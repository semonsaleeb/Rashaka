import { ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CartItem } from '../../models/CartItem';
import { ProductService } from '../services/product';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../services/favorite.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

declare var bootstrap: any;

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './cart-sidebar.html',
  styleUrl: './cart-sidebar.scss'
})
export class CartSidebar implements OnInit, OnDestroy {
  @Input() cartItems: CartItem[] = [];
  private GUEST_CART_KEY = 'guest_cart';
  progressValue = 80;
  isLoading = true;

  // 🟢 نخزن الـ callback علشان removeEventListener يشتغل صح
  private outsideClickHandler = this.handleOutsideClick.bind(this);

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public cartState: CartStateService,
    private auth: AuthService,
    private router: Router,
    private favoriteService: FavoriteService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  // ✅ هل المستخدم عامل تسجيل دخول
  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  // ✅ تحميل الكارت للـ guest
  private loadGuestCart(): any[] {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  // ✅ حفظ الكارت للـ guest
private saveGuestCart(cart: CartItem[]): void {
  // 1️⃣ حفظ في localStorage
  localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));

  // 2️⃣ تحديث الـ cartStateService
  this.cartState.updateItems(cart.map(item => ({
    ...item,
    totalPrice: Number(item.total_price),
    totalPriceAfterOffers: Number(item.total_price_after_offers),
  })));

  // 3️⃣ تحديث الـ cartItems المحلي
  this.cartItems = cart;
}


  // ✅ تحديث عدد العناصر
  private refreshCartCount(): void {
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

    this.cartState.updateCount(total);
  }

  // ✅ تحميل الكارت من الـ API
private loadCart(): void {
  this.cartService.getCart().subscribe({
    next: (response) => {
      this.cartItems = response.data?.items || [];
      this.refreshCartCount();
      this.cdr.detectChanges(); // 🟢 يخبر Angular عن التغيير
    },
    error: (err) => this.handleCartError(err)
  });
}


  // ====================== LIFECYCLE ======================

  ngOnInit(): void {
     if (!this.isLoggedIn()) {
    this.cartItems = this.loadGuestCart();
    this.refreshCartCount();
    this.cdr.detectChanges(); // 🟢 مهم هنا
  }
    const sidebarEl = document.getElementById('cartSidebar');

    if (sidebarEl) {
      // 🟢 log لما يتفتح
      sidebarEl.addEventListener('shown.bs.offcanvas', () => {
        // console.log('🟢 cartSidebar opened!');
      });

      // 🔴 log لما يتقفل
      sidebarEl.addEventListener('hidden.bs.offcanvas', () => {
        // console.log('🔴 cartSidebar closed!');
      });
    }

    // ⬅️ كليك على أي مكان برة الـ sidebar
    document.addEventListener('click', this.outsideClickHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.outsideClickHandler);
  }

  // ====================== HELPERS ======================

  private handleOutsideClick(event: MouseEvent) {
    const sidebarEl = document.getElementById('cartSidebar');
    if (sidebarEl && sidebarEl.classList.contains('show')) {
      if (!sidebarEl.contains(event.target as Node)) {
        console.log('🔹 Closing sidebar because of outside click');
        this.closeSidebar();
      }
    }
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

  // ====================== CART ACTIONS ======================

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
trackByProductId(index: number, item: CartItem): number {
  return item.product_id;
}

closeSidebar(): void {
  const sidebarEl = document.getElementById('cartSidebar');
  if (sidebarEl) {
    const offcanvas = bootstrap.Offcanvas.getInstance(sidebarEl)
      || new bootstrap.Offcanvas(sidebarEl);
    offcanvas.hide();

    // 🟢 شيل الـ backdrop على طول
    setTimeout(() => {
      const backdrops = document.querySelectorAll('.offcanvas-backdrop');
      backdrops.forEach(b => b.remove());
      document.body.classList.remove('offcanvas-backdrop'); 
    }, 200); // مهلة صغيرة علشان Bootstrap يلحق يقفل الأول
  }
}

}
