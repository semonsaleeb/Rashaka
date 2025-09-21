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

  // currentLang: string = 'en'; // أو '' حسب الحاجة
  dir: 'ltr' | 'rtl' = 'ltr'; // ⬅️ أضف هذا المتغير

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
  // 1️⃣ التحقق من التوكن وتسجيل الدخول
  this.token = localStorage.getItem('token') || '';
  this.isLoggedIn = !!this.token;

  // 2️⃣ تحميل بيانات المستخدم إذا مسجل دخول
  if (this.isLoggedIn) {
    this.loadClientProfile();
    this.fetchAddresses();

    // جلب رصيد الـ Free Product
    // بعد جلب رصيد المنتج المجاني
this.productService.getFreeProductBalance(this.token).subscribe({
  next: (res: any) => {
    this.freeProductBalance = res.data?.free_product_remaining ?? 0;
    this.maxFreeBalance=this.freeProductBalance
    console.log('Remaining Free Product Balance:', this.freeProductBalance);

    // تعيين القيمة الافتراضية
    this.setDefaultFreeBalanceAmount();
  },
  error: (err) => console.error('❌ Error fetching free product balance:', err)
});

  }

  // 3️⃣ تحميل السلة
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
        const unitPrice = parseFloat((item.unit_price ?? '0').toString().replace(/,/g, '')) || 0;
        const saleUnitPrice = item.sale_unit_price
          ? parseFloat(item.sale_unit_price.toString().replace(/,/g, ''))
          : null;
        return { ...item, unit_price: unitPrice, sale_unit_price: saleUnitPrice };
      });

      // حساب الإجماليات
      this.totalPrice = this.cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
      this.totalSalePrice = this.cartItems.reduce(
        (sum, item) => sum + (item.sale_unit_price || item.unit_price) * item.quantity,
        0
      );

      // تحديث عدد العناصر في السلة
      const totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
      this.cartState.updateCount(totalQuantity);
    },
    error: (err) => console.error('❌ Error loading cart', err)
  });

  // 4️⃣ التحقق من باراميترات تأكيد الطلب بعد الدفع
  const addressIdParam = this.route.snapshot.queryParamMap.get('addressId');
  const promoCodeParam = this.route.snapshot.queryParamMap.get('promoCode');

  if (addressIdParam) {
    this.cartService.placeOrder(+addressIdParam, 'credit_card', promoCodeParam || '').subscribe({
      next: (orderRes) => {
        console.log('📦 Server Response from placeOrder:', orderRes);
        alert('تم تأكيد الطلب بنجاح بعد الدفع!');
        this.router.navigate(['/order-success', orderRes.order_id]);
      },
      error: (err) => {
        console.error('❌ Error confirming order after payment:', err);
        alert('حدث خطأ في تأكيد الطلب بعد الدفع.');
      }
    });
  }

  // 5️⃣ ضبط اللغة والـ dir
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
  this.translate.use(this.currentLang);

  // الاستماع لتغييرات اللغة وتحديث dir تلقائيًا
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
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
  // 1️⃣ التحقق من بيانات العميل
  if (!this.client || !this.client.id) {
    console.error('بيانات العميل غير متوفرة');
    alert('خطأ في بيانات العميل، يرجى تسجيل الدخول مرة أخرى');
    return;
  }

  // 2️⃣ التحقق من عنوان الشحن
  if (!this.selectedAddressId) {
    console.error('لم يتم اختيار عنوان الشحن');
    alert('من فضلك اختر عنوان شحن صالح');
    return;
  }

  // 3️⃣ التحقق من طريقة الدفع
  if (!this.paymentMethod) {
    console.error('لم يتم اختيار طريقة الدفع');
    alert('من فضلك اختر طريقة دفع صالحة');
    return;
  }

  // 4️⃣ التحقق من وجود منتجات في السلة
  if (!this.cartItems || this.cartItems.length === 0) {
    console.error('السلة فارغة');
    alert('لا يوجد منتجات في سلة التسوق');
    return;
  }

  // 5️⃣ التحقق من اتصال الإنترنت
  if (!navigator.onLine) {
    console.error('لا يوجد اتصال بالإنترنت');
    alert('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت');
    return;
  }

  // 6️⃣ حساب قيمة الرصيد المجاني الممكن استخدامه
  let freeBalanceToApply = 0;
  if (this.applyFreeBalance && this.freeProductBalance > 0) {
    const totalCartPrice = this.cartItems.reduce((sum, item) => sum + item.total_price, 0);
    freeBalanceToApply = Math.min(this.freeBalanceAmount || totalCartPrice, this.freeProductBalance, totalCartPrice);
  }

  // 7️⃣ إرسال الطلب
  this.cartService.placeOrder(
    this.selectedAddressId,
    this.paymentMethod,
    this.promoCode,
    this.applyFreeBalance,
     this.freeBalanceAmount 
  ).subscribe({
    next: (orderRes) => {
      console.log('📦 استجابة السيرفر من placeOrder:', orderRes);
      console.log('💳 طريقة الدفع المختارة:', this.paymentMethod);

      if (!orderRes || !orderRes.order_id) {
        console.error('استجابة الطلب غير صالحة:', orderRes);
        alert('استجابة غير متوقعة من الخادم');
        return;
      }

      // التعامل مع الدفع
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
      console.error('❌ حدث خطأ أثناء إرسال الطلب:', err);
      if (err.error?.message) {
        alert(err.error.message);
      } else {
        alert('فشل إرسال الطلب. حاول مرة أخرى.');
      }
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


  private handleCashPayment(orderRes: any): void {
  if (!orderRes.order_id) {
    console.error('معرف الطلب غير متوفر في الاستجابة:', orderRes);
    alert('استجابة غير متوقعة من الخادم');
    return;
  }

  // تحديث الحالة إلى 'shipped'
  this.orderService.updateOrderStatus(orderRes.order_id, 'shipped').subscribe({
    next: (res) => {
      console.log('✅ تم تحديث حالة الطلب إلى شحن:', res);

      // فتح المودال بدلاً من alert
      const modalEl = document.getElementById('cashOrderModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
        modal.show();
      }
    },
    error: (err) => {
      console.error('❌ فشل تحديث حالة الطلب:', err);
      alert('تم تأكيد الطلب ولكن حدث خطأ في تحديث الحالة.');
      this.router.navigate(['/order-success', orderRes.order_id]).catch(e => console.error(e));
    }
  });
}

// دوال الأزرار في المودال
goHome() {
  const modalEl = document.getElementById('cashOrderModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
  this.router.navigate(['/']);
}

goOrders() {
  const modalEl = document.getElementById('cashOrderModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
  this.router.navigate(['/profile/orders']);
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



  // Variables

applyFreeBalance: boolean = false; // checkbox
freeBalanceAmount: number = 0; // القيمة اللي هيستخدمها
totalOrderPrice: number = 200; // سعر الطلب النهائي بعد الخصومات
maxFreeBalance: number = 0;

// // عند تغيير checkbox
// onFreeBalanceToggle() {
//   if (!this.applyFreeBalance) {
//     this.freeBalanceAmount = 0;
//   } else {
//     this.calculateMaxFreeBalance();
//   }
// }

// تحديد الحد الأقصى للقيمة المسموح بها
calculateMaxFreeBalance() {
  this.maxFreeBalance = Math.min(this.freeProductBalance, this.totalOrderPrice);
  if (this.freeBalanceAmount > this.maxFreeBalance) {
    this.freeBalanceAmount = this.maxFreeBalance;
  }
}

// عند تغيير checkbox
onFreeBalanceToggle() {
  if (!this.applyFreeBalance) {
    this.freeBalanceAmount = 0;
  } else {
    this.maxFreeBalance = this.freeProductBalance; // الحد الأقصى = رصيد المنتج المجاني
    if (this.freeBalanceAmount > this.maxFreeBalance) {
      this.freeBalanceAmount = this.maxFreeBalance;
    }
  }
}

// تحقق من صحة الإدخال
// validateFreeBalance() {
//   if (this.freeBalanceAmount > this.freeProductBalance) {
//     this.freeBalanceAmount = this.freeProductBalance;
//   } else if (this.freeBalanceAmount < 0) {
//     this.freeBalanceAmount = 0;
//   }
// }

setDefaultFreeBalanceAmount() {
  const total = this.totalSalePrice + this.shippingFee;
  this.freeBalanceAmount = Math.min(total, this.freeProductBalance);
}
// عند اختيار طريقة الدفع بالرصيد المجاني
onFreeBalanceRadioSelect() {
  if (this.paymentMethod === 'free_balance') {
    // الحد الأقصى = رصيد المنتجات المجانية
    this.maxFreeBalance = this.freeProductBalance;

    // القيمة الافتراضية = أقل بين المجموع أو الرصيد
    const total = this.totalSalePrice + this.shippingFee;
    this.freeBalanceAmount = Math.min(total, this.maxFreeBalance);
  } else {
    this.freeBalanceAmount = 0; // لو غيرت طريقة الدفع
  }
}

// التحقق من صحة الإدخال
validateFreeBalance() {
  if (this.freeBalanceAmount > this.maxFreeBalance) {
    this.freeBalanceAmount = this.maxFreeBalance;
  } else if (this.freeBalanceAmount < 0) {
    this.freeBalanceAmount = 0;
  }
}

// أزرار الزيادة والنقصان
incrementFreeBalance() {
  if (this.freeBalanceAmount < this.freeProductBalance) {
    this.freeBalanceAmount += 1;
  }
}

decrementFreeBalance() {
  if (this.freeBalanceAmount > 0) {
    this.freeBalanceAmount -= 1;
  }
}
get remainingBalance(): number {
  return this.freeProductBalance - this.freeBalanceAmount;
}

get grandTotal(): number {
  const total = this.totalSalePrice + this.shippingFee;
  return total <= this.freeProductBalance ? total : this.freeProductBalance;
}

}

