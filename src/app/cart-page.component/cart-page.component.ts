import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CartService,
  PromoResponse as ServicePromoResponse,
  CartResponse,
  CartItem
} from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart-page.component',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss']
})
export class CartPageComponent implements OnInit {
  // ================== Variables ==================
  progressValue = 80;

  cartItems: CartItem[] = [];

  /** إجمالي قبل الخصم (سعر الوحدة الأصلي * الكمية) */
  totalPrice: number = 0;

  /** إجمالي بعد الخصم (لو في sale_unit_price يُستخدم، وإلا السعر الأصلي) */
  totalSalePrice: number = 0;

  /** المخصوم = totalPrice - totalSalePrice */
  discountAmount: number = 0;

  addressId: number = 1;
  paymentMethod: string = 'cash';
  promoCode: string = '';
  token: string = '';
  isLoading = false;

  // popup flag
  showLoginPopup = false;

  // ================== Constructor ==================
  constructor(
    private cartService: CartService,
    private cartState: CartStateService,
    private http: HttpClient,
    private router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  // ================== Init ==================
  ngOnInit(): void {
    console.log('🟢 CartPageComponent INIT, token:', this.token);
    this.loadCart();
  }

  // ================== Helpers ==================
  private toNumber(value: any): number {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // ================== Load Cart ==================
  loadCart() {
    console.log('📦 loadCart called, token:', this.token);

    if (this.token) {
      // ✅ Logged in user
      this.cartService.getCart().subscribe({
        next: (response) => {
          const data: CartResponse = response?.data || {
            items: [],
            totalPrice: 0,
            totalQuantity: 0
          };

          let originalTotal = 0;
          let finalTotal = 0;
          let discountTotal = 0;

          this.cartItems = (data.items || []).map((item) => {
            const qty = item.quantity || 0;

            const unitPriceNum = parseFloat(item.unit_price as any) || 0;       // السعر الأصلي
            const saleUnitPriceNum = parseFloat(item.sale_unit_price as any) || 0; // سعر بعد الخصم (لو موجود)
            const discountedUnit = saleUnitPriceNum > 0 ? saleUnitPriceNum : unitPriceNum;

            originalTotal += unitPriceNum * qty;
            finalTotal += discountedUnit * qty;
            discountTotal += Math.max(unitPriceNum - discountedUnit, 0) * qty;

            return {
              ...item,
              nameAr: item.product_name_ar || 'منتج بدون اسم',
              unitPriceNum,
              saleUnitPriceNum,
              finalPrice: discountedUnit
            };
          });

          this.totalPrice = this.round2(originalTotal);
          this.totalSalePrice = this.round2(finalTotal);
          this.discountAmount = this.round2(discountTotal);
          this.progressValue = Math.min((this.totalSalePrice / 1000) * 100, 100);

          console.log('📊 Totals:', {
            totalPrice: this.totalPrice,
            totalSalePrice: this.totalSalePrice,
            discountAmount: this.discountAmount
          });
        },
        error: (err) => console.error('❌ Error loading cart:', err)
      });
    } else {
      // 👤 Guest user
      const data = this.cartService.getGuestCart();

      let originalTotal = 0;
      let finalTotal = 0;
      let discountTotal = 0;

      this.cartItems = (data.items || []).map((item) => {
        const qty = item.quantity || 0;

        const unitPriceNum = parseFloat(item.unit_price as any) || 0;
        const saleUnitPriceNum = parseFloat(item.sale_unit_price as any) || 0;
        const discountedUnit = saleUnitPriceNum > 0 ? saleUnitPriceNum : unitPriceNum;

        originalTotal += unitPriceNum * qty;
        finalTotal += discountedUnit * qty;
        discountTotal += Math.max(unitPriceNum - discountedUnit, 0) * qty;

        return { ...item, unitPriceNum, saleUnitPriceNum, finalPrice: discountedUnit };
      });

      // في حالة الضيف نعيد حساب الإجماليات بدقة بدل الاعتماد على قيم مخزنة قديمة
      this.totalPrice = this.round2(originalTotal);
      this.totalSalePrice = this.round2(finalTotal);
      this.discountAmount = this.round2(discountTotal);

      console.log('📊 Guest Totals:', {
        totalPrice: this.totalPrice,
        totalSalePrice: this.totalSalePrice,
        discountAmount: this.discountAmount
      });
    }
  }

  private handleCartResponse(data: CartResponse) {
    // احتفظنا بالدالة لو بتستخدم في أماكن تانية، بس loadCart هو المصدر الحقيقي للحسابات
    const items: CartItem[] = Array.isArray(data.items) ? data.items : [];
    this.cartItems = items;
    // يفضل عدم استخدام data.totalPrice هنا والاكتفاء بـ loadCart لحساب دقيق
  }

  // ================== Cart Operations ==================
  increaseQuantity(productId: number) {
    if (this.token) {
      this.cartService.addToCart(productId, 1).subscribe({ next: () => this.loadCart() });
    } else {
      const item = this.cartItems.find((i) => i.product_id === productId);
      if (item) {
        this.cartService.updateGuestQuantity(productId, item.quantity + 1);
        this.loadCart();
      }
    }
  }

  decreaseQuantity(productId: number) {
    if (this.token) {
      this.cartService.reduceCartItem(productId).subscribe({ next: () => this.loadCart() });
    } else {
      const item = this.cartItems.find((i) => i.product_id === productId);
      if (item && item.quantity > 1) {
        this.cartService.updateGuestQuantity(productId, item.quantity - 1);
        this.loadCart();
      }
    }
  }

  removeItem(productId: number) {
    if (this.token) {
      this.cartService.removeCartItem(productId).subscribe({ next: () => this.loadCart() });
    } else {
      this.cartService.removeGuestItem(productId);
      this.loadCart();
    }
  }

  // ================== Getters ==================
  get totalCartItemsCount(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  hasDiscount(): boolean {
    return this.discountAmount > 0;
  }

  trackByFn(index: number, item: CartItem): number {
    return item.product_id ?? index;
  }

  // ================== Place Order ==================
  placeOrder() {
    if (!this.token) {
      this.showLoginPopup = true; // اطلب تسجيل الدخول
      return;
    }
    this.router.navigate(['/placeOrder']);
  }

  // ================== Promo ==================
  applyPromoCode() {
    if (!this.promoCode || this.promoCode.trim() === '') {
      alert('أدخل كود الخصم أولًا');
      return;
    }

    // ابعتي الإجمالي قبل الخصم (الأصلي)
    const currentTotalToSend = this.totalPrice || this.totalSalePrice || 0;

    this.cartService.applyPromocode(this.promoCode, currentTotalToSend).subscribe({
      next: (res: ServicePromoResponse) => {
        if (res.success) {
          const original = this.toNumber(res.original_total);
          const afterPromo = this.toNumber(res.new_total);

          this.totalPrice = this.round2(original);
          this.totalSalePrice = this.round2(afterPromo);
          this.discountAmount = this.round2(this.totalPrice - this.totalSalePrice);

          alert(`تم تطبيق الكود: ${res.promocode} - خصم ${res.discount_amount}`);
        } else {
          alert('رمز الخصم غير صالح');
        }
      },
      error: (err) => {
        console.error('Promo error:', err);
        alert('حدث خطأ أثناء تطبيق الكود');
      }
    });
  }

  // ================== Popup Actions ==================
  goToLogin() {
    this.showLoginPopup = false;
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.showLoginPopup = false;
    this.router.navigate(['/auth/register']);
  }

  closePopup() {
    this.showLoginPopup = false;
  }
}
