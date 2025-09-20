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
  paymentMethod: string = 'cash'; // أو 'myfatoorah' حسب اختيارك الافتراضي
  promoCode: string = '';
  userEmail: string = '';
  userPhone: string = '';
  isLoggedIn: boolean = false;
  client: any;
  cartItems: any[] = [];
  totalPrice = 0;
  totalSalePrice = 0;
  addressId: number = 1;
  shippingFee: number = 30;
  freeProductBalance: number = 0; 


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
  // جلب التوكن والتحقق من تسجيل الدخول
  this.token = localStorage.getItem('token') || '';
  this.isLoggedIn = !!this.token;

  // إذا المستخدم مسجل دخول → تحميل البيانات الأساسية
  if (this.isLoggedIn) {
    this.loadClientProfile();
    this.fetchAddresses();

    // جلب free product balance
    this.productService.getFreeProductBalance(this.token).subscribe({
      next: (res) => {
        const remaining = res?.data?.balance?.remaining ?? 0;
        console.log('Remaining Free Product Balance:', remaining);
        this.freeProductBalance = remaining;
      },
      error: (err) => {
        console.error('❌ Error fetching free product balance:', err);
      }
    });
  }

  // تحميل السلة
  this.cartService.getCart().subscribe({
    next: (response) => {
      const cartData = response?.data;
      if (!cartData || !Array.isArray(cartData.items)) {
        console.warn('Cart data is empty or invalid');
        this.cartItems = [];
        this.totalPrice = 0;
        this.totalSalePrice = 0;
        this.cartState.updateCount(0);
        return;
      }

      // تحويل الأسعار من string إلى number
   this.cartItems = cartData.items.map(item => {
  // لو unit_price undefined حنخليه '0'
  const unitPriceStr = (item.unit_price ?? '0').toString();
  const unitPrice = parseFloat(unitPriceStr.replace(/,/g, '')) || 0;

  const saleUnitPriceStr = item.sale_unit_price ? item.sale_unit_price.toString() : '0';
  const saleUnitPrice = saleUnitPriceStr !== '0' 
    ? parseFloat(saleUnitPriceStr.replace(/,/g, '')) 
    : null;

  return {
    ...item,
    unit_price: unitPrice,
    sale_unit_price: saleUnitPrice
  };
});


      // حساب الإجماليات
      this.totalPrice = this.cartItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );
      this.totalSalePrice = this.cartItems.reduce(
        (sum, item) =>
          sum + (item.sale_unit_price || item.unit_price) * item.quantity,
        0
      );

      // تحديث عدد العناصر في السلة
      const totalQuantity = this.cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      this.cartState.updateCount(totalQuantity);
    },
    error: (err) => {
      console.error('Error loading cart', err);
    }
  });

  // التحقق من باراميترات تأكيد الطلب بعد الدفع
  const addressIdParam = this.route.snapshot.queryParamMap.get('addressId');
  const promoCodeParam = this.route.snapshot.queryParamMap.get('promoCode');

  if (addressIdParam) {
    this.cartService.placeOrder(+addressIdParam, 'credit_card', promoCodeParam || '').subscribe({
      next: (orderRes) => {
        console.log('📦 Server Response from placeOrder:', orderRes);
        console.log('💳 Payment Method:', this.paymentMethod);
        alert('تم تأكيد الطلب بنجاح بعد الدفع!');
        this.router.navigate(['/order-success', orderRes.order_id]);
      },
      error: (err) => {
        console.error('❌ Error confirming order after payment:', err);
        alert('حدث خطأ في تأكيد الطلب بعد الدفع.');
      }
    });
  }

  // إعداد اللغة الحالية
  this.translate.use(this.languageService.getCurrentLanguage());

  // الاستماع لتغييرات اللغة
  this.languageService.currentLang$.subscribe(lang => {
    this.translate.use(lang);
  });
}



  private getHeaders() {
    return new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });
  }
  applyPromoCode() {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });

    const body = {
      promocode: this.promoCode,
      total_price: this.totalPrice
    };

    this.http.post<PromoResponse>(`${environment.apiBaseUrl}/order/apply-promocode`, body, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.totalSalePrice = res.new_total;
            alert(`تم تطبيق الكود: ${res.promocode}`);
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
  loadClientProfile() {
    this.clientService.getProfile().subscribe({
      next: (res) => {
        this.client = res.client;
        console.log('✅ Client loaded:', this.client);
        this.userEmail = this.client.email || '';
        this.userPhone = this.client.phone || '';
      },
      error: (err) => {
        console.error('❌ Failed to load client profile:', err);
      }
    });
  }

  fetchAddresses() {
    this.addressService.getAllAddresses().subscribe({
      next: (res) => {
        console.log('Addresses API response:', res);
        this.addresses = res.data || res; // جرب ترجع البيانات من res.data أو من res مباشرة
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
      this.shippingFee = selectedAddr.fee || 0;
    }

    if (!this.selectedAddressId) {
      alert('من فضلك اختر عنوان شحن');
    }
    // ما فيش redirect هنا لأن الزرار منفصل مسؤول عن الإضافة.
  }

  navigateToAddAddress() {
    this.router.navigate(['/profile/addresses']);
  }


  placeOrder(): void {
    // 1. التحقق من البيانات الأساسية قبل الإرسال
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

    // 2. التحقق من وجود عناصر في السلة
    if (!this.cartItems || this.cartItems.length === 0) {
      console.error('السلة فارغة');
      alert('لا يوجد منتجات في سلة التسوق');
      return;
    }

    // 3. التحقق من اتصال الإنترنت
    if (!navigator.onLine) {
      console.error('لا يوجد اتصال بالإنترنت');
      alert('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت');
      return;
    }

    // 4. إظهار مؤشر تحميل
    // this.isLoading = true;

    this.cartService.placeOrder(
      this.selectedAddressId,
      this.paymentMethod,
      this.promoCode
    ).subscribe({
      next: (orderRes) => {
         console.log('📦 استجابة السيرفر من placeOrder:', orderRes);
  console.log('💳 طريقة الدفع المختارة:', this.paymentMethod);
        // this.isLoading = false;

        if (!orderRes || !orderRes.order_id) {
          console.error('استجابة الطلب غير صالحة:', orderRes);
          alert('استجابة غير متوقعة من الخادم');
          return;
        }

        if (this.paymentMethod === 'credit_card') {
          this.handleCreditCardPayment(orderRes);
        } else if (this.paymentMethod === 'cash') {
          this.handleCashPayment(orderRes);
        } else {
          console.error('طريقة دفع غير معروفة:', this.paymentMethod);
          alert('طريقة الدفع غير مدعومة');
        }
      },
      error: (err) => {
        // this.isLoading = false;
        this.handleOrderError(err);
      }
    });
  }

  // معالجة الدفع بالبطاقة الائتمانية
  private handleCreditCardPayment(orderRes: any): void {
    try {
      const totalAmount = Number(orderRes.total_price) + Number(this.shippingFee);

      if (isNaN(totalAmount) || totalAmount <= 0) {
        console.error('المبلغ الإجمالي غير صالح');
        alert('خطأ في حساب المبلغ الإجمالي');
        return;
      }

      const paymentData = {
        CustomerName: this.client?.name || 'عميل جديد',
        NotificationOption: 'Lnk',
        InvoiceValue: totalAmount,
        CustomerEmail: this.userEmail,
        CustomerMobile: this.userPhone,
        CallBackUrl: `${window.location.origin}/payment-success?orderId=${orderRes.order_id}`,
        ErrorUrl: `${window.location.origin}/payment-failure?orderId=${orderRes.order_id}`,
        Language: 'AR',
        DisplayCurrencyIso: 'SAR',
        CustomerReference: orderRes.order_id
      };

      console.log('بيانات الدفع المرسلة:', paymentData);

     this.paymentService.initiatePayment(paymentData).subscribe({
  next: (res: any) => {
    console.log('استجابة ماي فاتورة:', res);
    if (res.IsSuccess && res.Data?.InvoiceURL) {
      localStorage.setItem(
        'pendingPayment',
        JSON.stringify({ orderId: orderRes.order_id, paymentId: res.Data.InvoiceId })
      );
      window.location.href = res.Data.InvoiceURL;
    } else {
      const errorMsg = res.Message || 'تعذر إنشاء رابط الدفع';
      console.error('فشل في إنشاء الفاتورة:', errorMsg);
      alert(errorMsg);
    }
  },
  error: (err) => {
    console.error('خطأ في خدمة الدفع:', err);
    this.handlePaymentError(err);
  }
});

    } catch (e) {
      console.error('خطأ غير متوقع في معالجة الدفع:', e);
      alert('حدث خطأ غير متوقع أثناء معالجة الدفع');
    }
  }


  // معالجة الدفع نقداً عند الاستلام
  private handleCashPayment(orderRes: any): void {
    if (!orderRes.order_id) {
      console.error('معرف الطلب غير متوفر في الاستجابة:', orderRes);
      alert('استجابة غير متوقعة من الخادم');
      return;
    }

    alert('تم تأكيد الطلب والدفع سيتم نقدًا عند الاستلام.');
    this.router.navigate(['/order-success', orderRes.order_id]).catch(e => {
      console.error('خطأ في التوجيه إلى صفحة النجاح:', e);
      alert('تم تأكيد الطلب ولكن حدث خطأ في التوجيه');
    });
  }

  // معالجة أخطاء الطلب
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

  // معالجة أخطاء الدفع
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



loadCart() {
  this.cartService.getCart().subscribe({
    next: (response) => {
      const cartData = response?.data;
      if (!cartData || !Array.isArray(cartData.items)) {
        console.warn('Cart data is empty or invalid');
        this.cartItems = [];
        this.totalPrice = 0;
        this.totalSalePrice = 0;
        this.cartState.updateCount(0);
        return;
      }

      // Normalize prices: convert strings with commas to numbers
      this.cartItems = cartData.items.map(item => {
        const unitPrice = item.unit_price
          ? parseFloat(item.unit_price.toString().replace(/,/g, ''))
          : 0;
        const saleUnitPrice = item.sale_unit_price
          ? parseFloat(item.sale_unit_price.toString().replace(/,/g, ''))
          : null;

        return {
          ...item,
          unit_price: unitPrice,
          sale_unit_price: saleUnitPrice,
          total_price: unitPrice * item.quantity,
          total_price_after_offers: (saleUnitPrice || unitPrice) * item.quantity
        };
      });

      // Calculate totals
      this.totalPrice = this.cartItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );

      this.totalSalePrice = this.cartItems.reduce(
        (sum, item) => sum + (item.sale_unit_price || item.unit_price) * item.quantity,
        0
      );

      // Update cart count
      const totalQuantity = this.cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      this.cartState.updateCount(totalQuantity);
    },
    error: (err) => {
      console.error('Error loading cart', err);
    }
  });
}



// In your component

  /** افتح المودال لتأكيد الإلغاء */
  openCancelModal() {
    const modalEl = document.getElementById('cancelOrderModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      modal.show();
    }
  }

  /** تأكيد الإلغاء → حذف جميع العناصر وإعادة التوجيه */
  confirmCancelOrder() {
    const token = localStorage.getItem('token');

    if (token) {
      // Logged-in user → remove all items via API
      this.cartService.getCart().subscribe({
        next: (res) => {
          const items = res.data.items;

          // حذف كل المنتجات
          const removeRequests = items.map(item => this.cartService.removeCartItem(item.product_id));

          forkJoin(removeRequests).subscribe({
            next: () => {
              this.cartState.clearCart(); // تحديث حالة الكارت
              this.router.navigate(['/']); // Redirect للصفحة الرئيسية
            },
            error: (err) => console.error('Error removing items:', err)
          });
        },
        error: (err) => console.error('Error fetching cart:', err)
      });
    } else {
      // Guest user → clear localStorage
      this.cartService.clearGuestCart();
      this.cartState.clearCart(); // تحديث الحالة
      this.router.navigate(['/']); // Redirect للصفحة الرئيسية
    }

    // اغلاق المودال
    const modalEl = document.getElementById('cancelOrderModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }

  /** دالة عامة لزر الإلغاء */
  cancelOrder(): void {
    this.openCancelModal();
  }
}

