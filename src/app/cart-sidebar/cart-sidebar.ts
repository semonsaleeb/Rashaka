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
import { TruncatePipe } from '../truncate-pipe';

declare var bootstrap: any;

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, TruncatePipe],
  templateUrl: './cart-sidebar.html',
  styleUrl: './cart-sidebar.scss'
})
export class CartSidebar implements OnInit, OnDestroy {
  @Input() cartItems: CartItem[] = [];
  private GUEST_CART_KEY = 'guest_cart';
  progressValue = 80;
  isLoading = true;

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
    const parsedCart = cart ? JSON.parse(cart) : [];

    console.log("🛒 Guest Cart Loaded:", parsedCart);

    return parsedCart.map((item: any) => this.normalizeProduct(item));
  }

  // ✅ تطبيع المنتج قبل التخزين
  private normalizeProduct(item: any): CartItem {
    const unitPrice = safeNumber(item.unit_price ?? item.price ?? item.original_price);
    const saleUnitPrice = safeNumber(item.unit_price_after_offers ?? item.sale_unit_price ?? item.sale_price);
    const quantity = safeNumber(item.quantity ?? item.cart_quantity ?? 1);

    return {
      product_id: item.product_id ?? item.id,
      product_name: item.product_name ?? item.name,
      product_name_ar: item.product_name_ar ?? item.name_ar,
      images: item.images ?? (item.image ? [item.image] : []),

      unit_price: unitPrice,
      sale_unit_price: saleUnitPrice,
      unitPrice,
      saleUnitPrice,

      quantity,
      total_price: unitPrice * quantity,
      total_price_after_offers: (saleUnitPrice || unitPrice) * quantity,
    };
  }

  // ✅ حفظ الكارت للـ guest
  private saveGuestCart(cart: any[]): void {
    const normalizedCart = cart.map(item => this.normalizeProduct(item));

    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(normalizedCart));
    this.cartState.updateItems(normalizedCart);
    this.cartItems = normalizedCart;
  }

  // ✅ تحديث عدد العناصر
  private refreshCartCount(): void {
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + safeNumber(item.quantity), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + safeNumber(item.quantity), 0);

    this.cartState.updateCount(total);
  }

  // ✅ تحميل الكارت من الـ API
  private loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        const items = response.data?.items || [];
        this.cartItems = items.map((i: any) => this.normalizeProduct(i));

        console.log("🛒 Cart Items Loaded:", this.cartItems);

        this.cartState.updateItems(this.cartItems);
        this.refreshCartCount();
        this.cdr.detectChanges();
      },
      error: (err) => this.handleCartError(err)
    });
  }

  // ====================== LIFECYCLE ======================

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.cartItems = this.loadGuestCart();
      this.refreshCartCount();
      this.cdr.detectChanges();
    } else {
      this.loadCart();
    }

    // 🟢 subscribe لتحديث الكارت من CartStateService
this.cartState.cartItems$.subscribe(items => {
  this.cartItems = items;
  this.cdr.detectChanges();
});


    const sidebarEl = document.getElementById('cartSidebar');
    if (sidebarEl) {
      sidebarEl.addEventListener('shown.bs.offcanvas', () => {});
      sidebarEl.addEventListener('hidden.bs.offcanvas', () => {});
    }

    document.addEventListener('click', this.outsideClickHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.outsideClickHandler);
  }

  // ====================== HELPERS ======================

  private handleOutsideClick(event: MouseEvent) {
    const sidebarEl = document.getElementById('cartSidebar');
    if (sidebarEl && sidebarEl.classList.contains('show')) {
      const target = event.target as HTMLElement;

      if (sidebarEl.contains(target) && target.closest('.remove-btn')) {
        return;
      }

      if (!sidebarEl.contains(target)) {
        console.log('🔹 Closing sidebar because of outside click');
        this.closeSidebar();
        this.refreshCartCount();
        this.cdr.detectChanges();
      }
    }
  }

  onSidebarClosed(): void {
    console.log("🔹 Sidebar closed by button");
    this.refreshCartCount();
    this.cdr.detectChanges();
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
    this.cartState.updateItems([]);
  }

  // ====================== CART ACTIONS ======================

  increaseQuantity(productId: number) {
    this.cartService.updateQuantity(productId, this.getCurrentQuantity(productId) + 1).subscribe({
      next: () => {
        const current = this.cartState.getCartSummary().items;
        const item = current.find(i => i.product_id === productId);
        if (item) {
          item.quantity++;
          this.cartState.updateItems([...current]);
        }
      }
    });
  }

  decreaseQuantity(productId: number) {
    const currentQty = this.getCurrentQuantity(productId);
    if (currentQty <= 1) {
      this.removeItem(productId);
      return;
    }

    this.cartService.updateQuantity(productId, currentQty - 1).subscribe({
      next: () => {
        const current = this.cartState.getCartSummary().items;
        const item = current.find(i => i.product_id === productId);
        if (item) {
          item.quantity--;
          this.cartState.updateItems([...current]);
        }
      }
    });
  }

  removeItem(productId: number) {
    this.cartService.removeCartItem(productId).subscribe({
      next: () => {
        let current = this.cartState.getCartSummary().items;
        current = current.filter(i => i.product_id !== productId);
        this.cartState.updateItems([...current]);
      }
    });
  }

  private getCurrentQuantity(productId: number): number {
    const current = this.cartState.getCartSummary().items;
    const item = current.find(i => i.product_id === productId);
    return item ? item.quantity : 0;
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

      setTimeout(() => {
        const backdrops = document.querySelectorAll('.offcanvas-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('offcanvas-backdrop');
      }, 200);
    }
  }
}

// ✅ helper خارج الكلاس
function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}
