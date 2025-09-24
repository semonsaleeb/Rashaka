import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
declare var bootstrap: any;

@Component({
  selector: 'app-place-order',
  templateUrl: './place-order.html',
  styleUrls: ['./place-order.scss'],
  standalone: true,
  imports: [FormsModule, DecimalPipe, TranslateModule, CommonModule]
})
export class PlaceOrder implements OnInit {
  currentLang: string = 'ar';
  token: string = '';
  addresses: any[] = [];
  selectedAddressId: number | null = null;
  paymentMethod: string = 'cash'; // or 'credit_card' / 'free_balance' etc.
  promoCode: string = '';
  userEmail: string = '';
  userPhone: string = '';
  isLoggedIn: boolean = false;
  client: any;
  cartItems: any[] = [];
  totalPrice: number = 0;        // cart_total from API (before offers)
  totalSalePrice: number = 0;    // sale_cart_total from API (after offers)
  addressId: number = 1;
  shippingFee: number = 30;
  freeProductBalance: number = 0;
  discountValue: number = 0;
  dir: 'ltr' | 'rtl' = 'ltr';

  // Free-balance UI
  applyFreeBalance: boolean = false;
  freeBalanceAmount: number = 0;
  totalOrderPrice: number = 0; // optional: used by some UI calc, we keep updated
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

  // In your payment-success component
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
        this.maxFreeBalance = this.freeProductBalance;
        console.log('Remaining Free Product Balance:', this.freeProductBalance);

        // set default free balance (will use current totals)
        this.setDefaultFreeBalanceAmount();
      },
      error: (err) => console.error('❌ Error fetching free product balance:', err)
    });
  }

  // 3️⃣ Load cart (use central method)
  this.loadCart();

  // 4️⃣ Check if this is a payment callback (user returning from MyFatoorah)
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  
  if (orderId) {
    // This is a payment callback - check payment status
    this.cartService.checkPaymentStatus(orderId).subscribe({
      next: (statusRes: any) => {
        if (statusRes.status === 'preparing' || statusRes.status === 'confirmed') {
          // ✅ Payment successful
          this.clearCartAndPendingPayment();
          this.router.navigate(['/order-success', orderId]);
        } else if (statusRes.status === 'pending') {
          // 🔵 Still pending - show retry message
          alert('لم تكتمل عملية الدفع بعد. يرجى المحاولة مرة أخرى.');
          // Redirect back to checkout page to retry
          this.router.navigate(['/checkout']);
        } else {
          // ❌ Payment failed
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
    return; // Stop further execution since we're handling payment callback
  }

  // 5️⃣ Check for normal query params (legacy flow)
  const addressIdParam = this.route.snapshot.queryParamMap.get('addressId');
  const promoCodeParam = this.route.snapshot.queryParamMap.get('promoCode');

  if (addressIdParam) {
    // Legacy flow - confirm order after payment
    this.cartService.placeOrder(+addressIdParam, 'credit_card', promoCodeParam || '', false, 0).subscribe({
      next: (orderRes: any) => {
        console.log('📦 Server Response from placeOrder:', orderRes);
        
        // Handle response based on status
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

  // subscribe lang changes
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
    // remove commas if string and convert
    const s = String(value).replace(/,/g, '');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // update totals state from API cartData object
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

    // totals from backend (preferred)
    this.totalPrice = this.toNumber(cartData.cart_total);
    this.totalSalePrice = this.toNumber(cartData.sale_cart_total);
    this.discountValue = this.toNumber(cartData.discount_value);

    // update other values if provided
    if (cartData.remaining_free_balance !== undefined) {
      this.freeProductBalance = this.toNumber(cartData.remaining_free_balance);
    }

    // update cart count
    const totalQuantity = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(totalQuantity);

    // update UI helpers
    this.totalOrderPrice = this.totalSalePrice - this.discountValue;
    this.maxFreeBalance = Math.min(this.freeProductBalance, this.totalOrderPrice);
    // ensure freeBalanceAmount does not exceed new max
    if (this.freeBalanceAmount > this.maxFreeBalance) this.freeBalanceAmount = this.maxFreeBalance;
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

        // Use backend-provided totals (no manual calc)
        this.updateTotalsFromApi(cartData);

        console.log('Cart Totals from API:', {
          total: this.totalPrice,
          saleTotal: this.totalSalePrice,
          discount: this.discountValue,
          shippingFee: this.shippingFee,
          freeProductBalance: this.freeProductBalance,
          freeBalanceApplied: this.freeBalanceAmount
        });
      },
      error: (err) => {
        console.error('❌ Error loading cart', err);
      }
    });
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
            // use toNumber in case API returns string
            this.totalSalePrice = this.toNumber(res.new_total);
            // discountValue might be returned; update if available
            if (res.discount_value !== undefined) {
              this.discountValue = this.toNumber(res.discount_value);
            }
            alert(`تم تطبيق الكود: ${res.promocode || this.promoCode}`);
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
  // ✅ الفاليديشنات الأساسية
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

  // 🔹 حساب free balance
  let freeBalanceToApply = 0;
  if (this.applyFreeBalance && this.freeProductBalance > 0) {
    const base = this.totalSalePrice - this.discountValue;
    const totalCartPrice = Math.max(0, base);
    freeBalanceToApply = Math.min(
      this.freeBalanceAmount || totalCartPrice,
      this.freeProductBalance,
      totalCartPrice
    );
  }

  // 🔹 استدعاء placeOrder بشكل صحيح
  this.cartService.placeOrder(
    this.selectedAddressId,
    this.paymentMethod,
    this.promoCode,
    this.applyFreeBalance,
    freeBalanceToApply
  ).subscribe({
    next: (orderRes: any) => {
      console.log('📦 استجابة السيرفر من placeOrder:', orderRes);

      if (orderRes.status === 'success') {
        this.handleSuccessfulOrder(orderRes);
        this.router.navigate(['/order-success', orderRes.data.order_id]);
      } else if (orderRes.status === 'requires_payment_action') {
        if (orderRes.data.payment_url) {
          this.handleCreditCardPayment(orderRes);
        } else {
          console.error('No payment URL provided');
          alert('خطأ في رابط الدفع');
        }
      } else if (orderRes.status === 'error') {
        alert(orderRes.message || 'حدث خطأ أثناء إنشاء الطلب');
      }
    },
    error: (err) => {
      console.error('❌ حدث خطأ أثناء إرسال الطلب:', err);
      this.handleOrderError(err);
    }
  });
}



// Add these methods to your PlaceOrder class

private handleSuccessfulOrder(orderRes: any): void {
  // Clear cart and reset values
  this.cartState.clearCart();
  localStorage.removeItem('cart');
  this.freeBalanceAmount = 0;
  this.promoCode = '';
  this.applyFreeBalance = false;
  
  console.log('✅ Order completed successfully:', orderRes);
}

private clearCartAndPendingPayment(): void {
  // Clear cart
  this.cartState.clearCart();
  localStorage.removeItem('cart');
  
  // Clear pending payment data
  localStorage.removeItem('pendingPayment');
  
  // Reset form values
  this.freeBalanceAmount = 0;
  this.promoCode = '';
  this.applyFreeBalance = false;
}

// ========================= Payment handlers =========================
private handleCreditCardPayment(orderRes: any): void {
  try {
    // Store pending payment info
    localStorage.setItem(
      'pendingPayment',
      JSON.stringify({ 
        orderId: orderRes.data.order_id, 
        invoiceId: orderRes.data.invoice_id 
      })
    );

    // Redirect to MyFatoorah payment page
    window.location.href = orderRes.data.payment_url;
    
  } catch (e) {
    console.error('خطأ غير متوقع في معالجة الدفع:', e);
    alert('حدث خطأ غير متوقع أثناء معالجة الدفع');
  }
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

      // 🟢 فضي الكارت بعد الدفع الكاش
      this.cartState.clearCart();
      localStorage.removeItem('cart');
      this.freeBalanceAmount = 0;
      this.promoCode = '';
      this.applyFreeBalance = false;

      // show modal
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
      // Logged-in user → remove all items via API
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
      // Guest user → clear localStorage
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

  // ========================= Free balance helpers =========================
calculateMaxFreeBalance() {
  // السعر الأساسي: إجمالي السعر بعد الخصم + الشحن
  const base = Math.max(0, this.totalSalePrice);

  // لو freeProductBalance أكبر من السعر، نخلي الحد الأقصى هو السعر (base)
  // لو freeProductBalance أصغر من السعر، نخلي الحد الأقصى هو freeProductBalance
  this.maxFreeBalance = this.freeProductBalance >= base ? base : this.freeProductBalance;

  // لو القيمة اللي مدخلة أكبر من المسموح بيه، نرجعها للحد الأقصى
  if (this.freeBalanceAmount > this.maxFreeBalance) {
    this.freeBalanceAmount = this.maxFreeBalance;
  }
}


  onFreeBalanceToggle() {
    if (!this.applyFreeBalance) {
      this.freeBalanceAmount = 0;
    } else {
      this.calculateMaxFreeBalance();
    }
  }

  setDefaultFreeBalanceAmount() {
    const total = Math.max(0, this.totalSalePrice  - this.discountValue);
    this.freeBalanceAmount = Math.min(total, this.freeProductBalance);
  }

  onFreeBalanceRadioSelect() {
    if (this.paymentMethod === 'free_balance') {
      this.calculateMaxFreeBalance();
      this.freeBalanceAmount = Math.min(this.maxFreeBalance, this.freeProductBalance);
    } else {
      this.freeBalanceAmount = 0;
    }
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

  get grandTotal(): number {
    // total after offers + shipping - free balance applied - discount (discount already applied in totalSalePrice if backend returns it)
    // Use: sale total + shipping - discountValue - freeBalanceAmount
    const base = this.totalSalePrice - this.discountValue;
    const afterFree = base - (this.applyFreeBalance ? this.freeBalanceAmount : 0);
    return this.round2(afterFree > 0 ? afterFree : 0);
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
