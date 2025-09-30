import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../services/client.service';
import { AddressService } from '../services/address.service';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { PromoResponse } from '../../models/PromoResponse';
import { PaymentService } from '../services/payment.service';
import { OrderService } from '../services/order.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { ProductService } from '../services/product';
import { forkJoin } from 'rxjs';
import { TruncatePipe } from '../truncate-pipe';
declare var bootstrap: any;

@Component({
  selector: 'app-place-order',
  templateUrl: './place-order.html',
  styleUrls: ['./place-order.scss'],
  standalone: true,
  imports: [FormsModule, DecimalPipe, TranslateModule, CommonModule, TruncatePipe]
})
export class PlaceOrder implements OnInit {
  currentLang: string = 'ar';
  token: string = '';
  addresses: any[] = [];
  selectedAddressId: number | null = null;
  paymentMethod: string = 'cash';
  promoCode: string = '';
  userEmail: string = '';
  userPhone: string = '';
  isLoggedIn: boolean = false;
  client: any;
  cartItems: any[] = [];
  totalPrice: number = 0;
  totalSalePrice: number = 0;
  addressId: number = 1;
  shippingFee: number = 30;
  freeProductBalance: number = 0;
  discountValue: number = 0;
  dir: 'ltr' | 'rtl' = 'ltr';
  
  // Free balance totals from API
  cart_total_without_free: number = 0;
  cart_total_after_free: number = 0;
  free_balance_applied: number = 0;

  // Free-balance UI
  applyFreeBalance: boolean = false;
  freeBalanceAmount: number = 0;
  totalOrderPrice: number = 0;
  maxFreeBalance: number = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private clientService: ClientService,
    private addressService: AddressService,
    private cartService: CartService,
    private cartState: CartStateService,
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private productService: ProductService,
  ) { }

  ngOnInit(): void {
    // 1️⃣ Token & login
    this.token = localStorage.getItem('token') || '';
    this.isLoggedIn = !!this.token;

    // 2️⃣ Load client/profile/addresses if logged in
    if (this.isLoggedIn) {
      this.loadClientProfile();
      this.fetchAddresses();

      // fetch free product balance
      this.productService.getFreeProductBalance(this.token).subscribe({
        next: (res: any) => {
          this.freeProductBalance = this.toNumber(res?.data?.free_product_remaining ?? 0);
          console.log('Remaining Free Product Balance:', this.freeProductBalance);
        },
        error: (err) => console.error('❌ Error fetching free product balance:', err)
      });
    }

    // 3️⃣ Load cart
    this.loadCart();

    // 4️⃣ Check if this is a payment callback
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
      this.cartService.checkPaymentStatus(orderId).subscribe({
        next: (statusRes: any) => {
          if (statusRes.status === 'preparing' || statusRes.status === 'confirmed') {
            this.clearCartAndPendingPayment();
            this.router.navigate(['/order-success', orderId]);
          } else if (statusRes.status === 'pending') {
            alert('لم تكتمل عملية الدفع بعد. يرجى المحاولة مرة أخرى.');
            this.router.navigate(['/checkout']);
          } else {
            this.router.navigate(['/payment-failure'], { 
              queryParams: { orderId, error: statusRes.message } 
            });
          }
        },
        error: (err: any) => {
          console.error('Error checking payment status:', err);
          this.router.navigate(['/payment-failure'], { 
            queryParams: { orderId, error: 'تعذر التحقق من حالة الدفع' } 
          });
        }
      });
      return;
    }

    // 5️⃣ Check for normal query params
    const addressIdParam = this.route.snapshot.queryParamMap.get('addressId');
    const promoCodeParam = this.route.snapshot.queryParamMap.get('promoCode');

    if (addressIdParam) {
      this.cartService.placeOrder(+addressIdParam, 'credit_card', promoCodeParam || '', false, 0).subscribe({
        next: (orderRes: any) => {
          console.log('📦 Server Response from placeOrder:', orderRes);
          
          if (orderRes.status === 'success') {
            this.handleSuccessfulOrder(orderRes);
            this.router.navigate(['/order-success', orderRes.data.order_id]);
          } else if (orderRes.status === 'requires_payment_action') {
            this.handleCreditCardPayment(orderRes);
          } else {
            alert('تم تأكيد الطلب بنجاح بعد الدفع!');
            this.router.navigate(['/order-success', orderRes.order_id]);
          }
        },
        error: (err) => {
          console.error('❌ Error confirming order after payment:', err);
          alert('حدث خطأ في تأكيد الطلب بعد الدفع.');
        }
      });
    }

    // 6️⃣ language & dir
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    this.translate.use(this.currentLang);

    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
      this.translate.use(lang);
    });
  }

  // ========================= Utilities =========================
  private getHeaders() {
    return new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const s = String(value).replace(/,/g, '');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // ========================= Cart load =========================
  loadCart() {
    this.cartService.getCart().subscribe({
      next: (response: any) => {
        console.log('📦 Full Cart API Response:', response);
        const cartData = response?.data;
        if (!cartData || !Array.isArray(cartData.items)) {
          console.warn('Cart data is empty or invalid');
          this.cartItems = [];
          this.totalPrice = 0;
          this.totalSalePrice = 0;
          this.discountValue = 0;
          this.cartState.updateCount(0);
          return;
        }

        this.updateTotalsFromApi(cartData);

        console.log('🔄 Cart Totals updated:', {
          cart_total_without_free: this.cart_total_without_free,
          cart_total_after_free: this.cart_total_after_free,
          free_balance_applied: this.free_balance_applied,
          applyFreeBalance: this.applyFreeBalance,
          currentGrandTotal: this.grandTotal
        });
      },
      error: (err) => {
        console.error('❌ Error loading cart', err);
      }
    });
  }

  // ========================= Update totals from API =========================
  private updateTotalsFromApi(cartData: any) {
    this.cartItems = (cartData.items || []).map((item: any) => {
      const unitPrice = this.toNumber(item.unit_price);
      const saleUnitPrice = item.sale_unit_price != null ? this.toNumber(item.sale_unit_price) : null;
      return {
        ...item,
        unit_price: unitPrice,
        sale_unit_price: saleUnitPrice,
        total_price: this.toNumber(item.total_price) || unitPrice * (item.quantity || 1),
        total_price_after_offers: this.toNumber(item.total_price_after_offers) || (saleUnitPrice || unitPrice) * (item.quantity || 1)
      };
    });

    // ✅ Update totals from backend
    this.totalPrice = this.toNumber(cartData.cart_total);
    this.totalSalePrice = this.toNumber(cartData.sale_cart_total);
    this.discountValue = this.toNumber(cartData.discount_value);
    
    // ✅ Free balance totals from backend
    this.cart_total_without_free = this.toNumber(cartData.cart_total_without_free);
    this.cart_total_after_free = this.toNumber(cartData.cart_total_after_free);
    this.free_balance_applied = this.toNumber(cartData.free_balance_applied);

    // ✅ Update cart count
    const totalQuantity = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(totalQuantity);

    // ✅ Set max free balance to what backend allows
    this.maxFreeBalance = this.free_balance_applied;
    
    // ✅ Auto-set free balance amount when toggled on
    if (this.applyFreeBalance) {
      this.freeBalanceAmount = this.maxFreeBalance;
    }

    console.log('🟢 Totals updated from API:', {
      cart_total_without_free: this.cart_total_without_free,
      cart_total_after_free: this.cart_total_after_free,
      free_balance_applied: this.free_balance_applied,
      maxFreeBalance: this.maxFreeBalance,
      freeBalanceAmount: this.freeBalanceAmount
    });
  }

  // ========================= Grand Total Calculation =========================
  get grandTotal(): number {
    if (this.applyFreeBalance && this.freeBalanceAmount > 0) {
      // When free balance is applied, use cart_total_after_free
      return this.cart_total_after_free;
    } else {
      // When free balance is not applied, use cart_total_without_free
      return this.cart_total_without_free;
    }
  }

  // ========================= Free balance helpers =========================
  onFreeBalanceToggle() {
    if (this.applyFreeBalance) {
      // When enabling free balance, set to the maximum available from backend
      this.freeBalanceAmount = this.maxFreeBalance;
      console.log('✅ Free balance enabled, amount set to:', this.freeBalanceAmount);
    } else {
      // When disabling, reset to 0
      this.freeBalanceAmount = 0;
      console.log('❌ Free balance disabled');
    }
    
    console.log('🔄 Grand total after toggle:', this.grandTotal);
  }

  validateFreeBalance() {
    if (this.freeBalanceAmount > this.maxFreeBalance) {
      this.freeBalanceAmount = this.maxFreeBalance;
    } else if (this.freeBalanceAmount < 0) {
      this.freeBalanceAmount = 0;
    }
  }

  incrementFreeBalance() {
    if (this.freeBalanceAmount < this.maxFreeBalance) {
      this.freeBalanceAmount = this.round2(this.freeBalanceAmount + 1);
    }
  }

  decrementFreeBalance() {
    if (this.freeBalanceAmount > 0) {
      this.freeBalanceAmount = this.round2(this.freeBalanceAmount - 1);
    }
  }

  get remainingBalance(): number {
    return this.round2(this.freeProductBalance - this.freeBalanceAmount);
  }

  // ========================= Promo =========================
  applyPromoCode() {
    const headers = this.getHeaders();
    const body = {
      promocode: this.promoCode,
      total_price: this.totalPrice
    };

    this.http.post<PromoResponse>(`${environment.apiBaseUrl}/order/apply-promocode`, body, { headers })
      .subscribe({
        next: (res: any) => {
          if (res && res.success) {
            this.totalSalePrice = this.toNumber(res.new_total);
            if (res.discount_value !== undefined) {
              this.discountValue = this.toNumber(res.discount_value);
            }
            alert(`تم تطبيق الكود: ${res.promocode || this.promoCode}`);
            // Reload cart to get updated totals
            this.loadCart();
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

  // ========================= Client & Addresses =========================
  loadClientProfile() {
    this.clientService.getProfile().subscribe({
      next: (res: any) => {
        this.client = res.client;
        console.log('✅ Client loaded:', this.client);
        this.userEmail = this.client?.email || '';
        this.userPhone = this.client?.phone || '';
      },
      error: (err) => {
        console.error('❌ Failed to load client profile:', err);
      }
    });
  }

  fetchAddresses() {
    this.addressService.getAllAddresses().subscribe({
      next: (res: any) => {
        console.log('Addresses API response:', res);
        this.addresses = res.data || res || [];
        if (this.addresses.length > 0) {
          this.selectedAddressId = this.addresses[0].id;
        }
      },
      error: () => {
        alert('فشل تحميل العناوين');
      }
    });
  }

  onAddressChange() {
    const selectedAddr = this.addresses.find(addr => addr.id === this.selectedAddressId);
    if (selectedAddr) {
      this.shippingFee = this.toNumber(selectedAddr.fee || 0);
    }

    if (!this.selectedAddressId) {
      alert('من فضلك اختر عنوان شحن');
    }
  }

  navigateToAddAddress() {
    this.router.navigate(['/profile/addresses']);
  }

  // ========================= Place order =========================
  placeOrder(): void {
    // ✅ Basic validations
    if (!this.client || !this.client.id) {
      console.error('بيانات العميل غير متوفرة');
      alert('خطأ في بيانات العميل، يرجى تسجيل الدخول مرة أخرى');
      return;
    }

    if (!this.selectedAddressId) {
      console.error('لم يتم اختيار عنوان الشحن');
      alert('من فضلك اختر عنوان شحن صالح');
      return;
    }

    if (!this.paymentMethod) {
      console.error('لم يتم اختيار طريقة الدفع');
      alert('من فضلك اختر طريقة دفع صالحة');
      return;
    }

    if (!this.cartItems || this.cartItems.length === 0) {
      console.error('السلة فارغة');
      alert('لا يوجد منتجات في سلة التسوق');
      return;
    }

    if (!navigator.onLine) {
      console.error('لا يوجد اتصال بالإنترنت');
      alert('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت');
      return;
    }

    // 🔹 Calculate free balance to apply
    let freeBalanceToApply = 0;
    if (this.applyFreeBalance) {
      freeBalanceToApply = this.freeBalanceAmount;
    }

    console.log('🔄 Placing order with:', {
      applyFreeBalance: this.applyFreeBalance,
      freeBalanceToApply: freeBalanceToApply,
      currentGrandTotal: this.grandTotal,
      paymentMethod: this.paymentMethod
    });

    // 🔹 Call placeOrder with the correct parameters
    this.cartService.placeOrder(
      this.selectedAddressId,
      this.paymentMethod,
      this.promoCode,
      this.applyFreeBalance,
      freeBalanceToApply
    ).subscribe({
      next: (orderRes: any) => {
        console.log('📦 Server response from placeOrder:', orderRes);
        this.handleOrderResponse(orderRes);
      },
      error: (err) => {
        console.error('❌ Error placing order:', err);
        this.handleOrderError(err);
      }
    });
  }

  private handleOrderResponse(orderRes: any) {
    if (orderRes.status === 'success') {
      this.handleSuccessfulOrder(orderRes);
      if (this.paymentMethod === 'cash') {
        this.showCashSuccessModal(orderRes);
      } else {
        this.router.navigate(['/order-success', orderRes.data.order_id]);
      }
    } else if (orderRes.status === 'requires_payment_action') {
      this.handleCreditCardPayment(orderRes);
    } else if (orderRes.status === 'error') {
      alert(orderRes.message || 'حدث خطأ أثناء إنشاء الطلب');
    }
  }

  private showCashSuccessModal(orderRes: any) {
    const modalEl = document.getElementById('cashOrderModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      modal.show();
    } else {
      this.router.navigate(['/order-success', orderRes.data.order_id]);
    }
  }

  private handleSuccessfulOrder(orderRes: any): void {
    this.cartState.clearCart();
    localStorage.removeItem('cart');
    this.freeBalanceAmount = 0;
    this.promoCode = '';
    this.applyFreeBalance = false;
    
    console.log('✅ Order completed successfully:', orderRes);
  }

  private clearCartAndPendingPayment(): void {
    this.cartState.clearCart();
    localStorage.removeItem('cart');
    localStorage.removeItem('pendingPayment');
    this.freeBalanceAmount = 0;
    this.promoCode = '';
    this.applyFreeBalance = false;
  }

  // ========================= Payment handlers =========================



private handleCreditCardPayment(addressId: number): void {
  this.cartService.placeOrder(addressId, 'credit_card').subscribe({
    next: (res) => {
      if (res?.data?.payment_url) {
        localStorage.setItem(
          'pendingPayment',
          JSON.stringify({
            orderId: res.data.order_id,
            invoiceId: res.data.invoice_id
          })
        );
        window.location.href = res.data.payment_url;
      } else {
        console.error('⚠️ لم يتم استرجاع رابط الدفع:', res);
        alert('حصل خطأ أثناء تجهيز الدفع، حاول تاني.');
      }
    },
    error: (err) => {
      console.error('❌ خطأ أثناء استدعاء checkout/submit:', err);
      alert('فشل في إنشاء الطلب أو بدء الدفع');
    }
  });
}




  private handleCashPayment(orderRes: any): void {
    if (!orderRes.order_id) {
      console.error('معرف الطلب غير متوفر في الاستجابة:', orderRes);
      alert('استجابة غير متوقعة من الخادم');
      return;
    }

    this.orderService.updateOrderStatus(orderRes.order_id, 'shipped').subscribe({
      next: (res) => {
        console.log('✅ تم تحديث حالة الطلب إلى شحن:', res);
        this.cartState.clearCart();
        localStorage.removeItem('cart');
        this.freeBalanceAmount = 0;
        this.promoCode = '';
        this.applyFreeBalance = false;

        const modalEl = document.getElementById('cashOrderModal');
        if (modalEl) {
          const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
          modal.show();
        } else {
          this.router.navigate(['/order-success', orderRes.order_id]);
        }
      },
      error: (err) => {
        console.error('❌ فشل تحديث حالة الطلب:', err);
        alert('تم تأكيد الطلب ولكن حدث خطأ في تحديث الحالة.');
        this.router.navigate(['/order-success', orderRes.order_id]).catch(e => console.error(e));
      }
    });
  }

  goHome() {
    const modalEl = document.getElementById('cashOrderModal');
    const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (modalInstance) modalInstance.hide();
    this.router.navigate(['/']);
  }

  goOrders() {
    const modalEl = document.getElementById('cashOrderModal');
    const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (modalInstance) modalInstance.hide();
    this.router.navigate(['/profile/orders']);
  }

  // ========================= Cancel order / clear cart =========================
  openCancelModal() {
    const modalEl = document.getElementById('cancelOrderModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      modal.show();
    }
  }

  confirmCancelOrder() {
    const token = localStorage.getItem('token');

    if (token) {
      this.cartService.getCart().subscribe({
        next: (res: any) => {
          const items = res.data?.items || [];
          const removeRequests = items.map((item: any) => this.cartService.removeCartItem(item.product_id));
          forkJoin(removeRequests).subscribe({
            next: () => {
              this.cartState.clearCart();
              this.router.navigate(['/']);
            },
            error: (err) => console.error('Error removing items:', err)
          });
        },
        error: (err) => console.error('Error fetching cart:', err)
      });
    } else {
      this.cartService.clearGuestCart();
      this.cartState.clearCart();
      this.router.navigate(['/']);
    }

    const modalEl = document.getElementById('cancelOrderModal');
    const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (modalInstance) modalInstance.hide();
  }

  cancelOrder(): void {
    this.openCancelModal();
  }

  // ========================= Error handlers =========================
  private handleOrderError(err: any): void {
    let errorMessage = 'حدث خطأ أثناء إتمام الطلب';

    if (err.status === 0) {
      errorMessage = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت';
    } else if (err.status === 400) {
      errorMessage = 'بيانات الطلب غير صالحة';
    } else if (err.status === 401) {
      errorMessage = 'غير مصرح بالوصول، يرجى تسجيل الدخول مرة أخرى';
    } else if (err.status === 404) {
      errorMessage = 'الخدمة غير متوفرة حالياً';
    } else if (err.status === 500) {
      errorMessage = 'خطأ في الخادم الداخلي';
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.message) {
      errorMessage = err.message;
    }

    console.error('تفاصيل الخطأ:', {
      status: err.status,
      message: err.message,
      error: err.error,
      url: err.url
    });

    alert(errorMessage);
  }

  private handlePaymentError(err: any): void {
    let errorMessage = 'حدث خطأ أثناء معالجة الدفع';

    if (err.status === 0) {
      errorMessage = 'تعذر الاتصال بخدمة الدفع. يرجى التحقق من اتصال الإنترنت';
    } else if (err.status === 400) {
      errorMessage = 'بيانات الدفع غير صالحة';
    } else if (err.status === 401) {
      errorMessage = 'مفتاح API غير صالح لخدمة الدفع';
    } else if (err.error?.Message) {
      errorMessage = err.error.Message;
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    }

    console.error('تفاصيل خطأ الدفع:', {
      status: err.status,
      message: err.message,
      error: err.error,
      url: err.url
    });

    alert(errorMessage);
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch {
      return null;
    }
  }
}