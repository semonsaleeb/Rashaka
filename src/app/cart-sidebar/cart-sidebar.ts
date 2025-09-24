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
  const parsedCart = cart ? JSON.parse(cart) : [];

  // 🟢 log للـ cart بعد التحميل
  console.log("🛒 Guest Cart Loaded:", parsedCart);

  // 🟢 log لكل منتج
  parsedCart.forEach((item: any, i: number) => {
    console.log(`Guest Product ${i + 1}:`, {
      id: item.product_id,
      name: item.product_name ?? item.product_name_ar ?? 'No name',
      quantity: item.quantity,
      price:Number( item.unit_price ?? item.price)
    });
  });

  return parsedCart;
}

private normalizeProduct(item: any): CartItem {
  // 🟢 حدد الأسعار
  const rawUnitPrice = item.unit_price ?? item.price ?? item.original_price;
  const rawSalePrice = item.unit_price_after_offers ?? item.sale_unit_price ?? item.sale_price;

  const unitPrice: number = rawUnitPrice !== undefined ? Number(rawUnitPrice) : 0;
  const salePrice: number | null =
    rawSalePrice !== undefined ? Number(rawSalePrice) : null;

  const quantity = Number(item.quantity ?? item.cart_quantity ?? 1);

  return {
    product_id: item.product_id ?? item.id,
    product_name: item.product_name ?? item.name,
    product_name_ar: item.product_name_ar ?? item.name_ar,
    images: item.images ?? (item.image ? [item.image] : []),

    unit_price: unitPrice,
    unit_price_after_offers: salePrice?.toString(), // number | null

    quantity,

    total_price: unitPrice * quantity,
    total_price_after_offers: (salePrice ?? unitPrice) * quantity,
  };
}




toNumber(value: string | number | undefined): number {
  return Number(value ?? 0);
}


  // ✅ حفظ الكارت للـ guest
private saveGuestCart(cart: any[]): void {
  const normalizedCart = cart.map(item => this.normalizeProduct(item));

  // 1️⃣ حفظ في localStorage
  localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(normalizedCart));

  // 2️⃣ تحديث الـ cartStateService
  this.cartState.updateItems(normalizedCart);

  // 3️⃣ تحديث الكارت المحلي
  this.cartItems = normalizedCart;
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

      // 🟢 اعمل log لكل المنتجات
      console.log("🛒 Cart Items Loaded:", this.cartItems);

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
