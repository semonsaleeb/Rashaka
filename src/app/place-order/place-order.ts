import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../services/client.service';
import { AddressService } from '../services/address.service';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { DecimalPipe } from '@angular/common';
import { PromoResponse } from '../../models/PromoResponse';

@Component({
  selector: 'app-place-order',
  templateUrl: './place-order.html',
  styleUrls: ['./place-order.scss'],
  standalone: true,
  imports: [FormsModule, DecimalPipe] 
})
export class PlaceOrder implements OnInit {
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


  constructor(
    private http: HttpClient,
    private router: Router,
    private clientService: ClientService,
    private addressService: AddressService,
        private cartService: CartService,
            private cartState: CartStateService,
         private route: ActivatedRoute,
    
  ) {}


  ngOnInit(): void {
  this.token = localStorage.getItem('token') || '';
  this.isLoggedIn = !!this.token;

  // تحميل البيانات الأساسية لو المستخدم مسجل دخول
  if (this.isLoggedIn) {
    this.loadClientProfile();
    this.fetchAddresses();
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

      this.cartItems = cartData.items;

      this.totalPrice = this.cartItems.reduce(
        (sum, item) => sum + item.quantity * parseFloat(item.unit_price),
        0
      );

      this.totalSalePrice = this.cartItems.reduce(
        (sum, item) =>
          sum +
          (item.sale_unit_price
            ? item.quantity * parseFloat(item.sale_unit_price)
            : item.quantity * parseFloat(item.unit_price)),
        0
      );

      const totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
      this.cartState.updateCount(totalQuantity);
    },
    error: (err) => {
      console.error('Error loading cart', err);
    }
  });

  // التحقق هل الصفحة تحتوي على باراميترات تأكيد الطلب بعد الدفع
  const addressIdParam = this.route.snapshot.queryParamMap.get('addressId');
  const promoCodeParam = this.route.snapshot.queryParamMap.get('promoCode');
  if (addressIdParam) {
    // إذا وجدت باراميترات، أكد الطلب مباشرة (مثلاً بعد الدفع)
    this.cartService.placeOrder(+addressIdParam, 'credit_card', promoCodeParam || '').subscribe({
      next: (orderRes) => {
        alert('تم تأكيد الطلب بنجاح بعد الدفع!');
        this.router.navigate(['/order-success', orderRes.order_id]);
      },
      error: (err) => {
        console.error('❌ خطأ في تأكيد الطلب بعد الدفع:', err);
        alert('حدث خطأ في تأكيد الطلب بعد الدفع.');
      }
    });
  }
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

    if (isNaN(totalAmount)) {
      console.error('المبلغ الإجمالي غير صالح:', orderRes.total_price, this.shippingFee);
      alert('خطأ في حساب المبلغ الإجمالي');
      return;
    }

    if (totalAmount <= 0) {
      console.error('المبلغ الإجمالي يجب أن يكون أكبر من الصفر:', totalAmount);
      alert('المبلغ الإجمالي غير صالح');
      return;
    }

    const paymentData = {
      CustomerName: this.client?.name || 'عميل جديد',
      NotificationOption: 'Lnk',
      InvoiceValue: totalAmount,
      CustomerEmail: this.userEmail,
      CallBackUrl: `https://rshaka.ghaytiapp.com/payment-success?orderId=${orderRes.order_id}`,
      ErrorUrl: `https://rshaka.ghaytiapp.com/payment-failure?orderId=${orderRes.order_id}`,
      Language: 'AR',
      DisplayCurrencyIso: 'SAR'
    };

    console.log('بيانات الدفع المرسلة:', paymentData);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'QU5B_LUdoeZHdliM09PdwL9tBlLpD8oOfEAaRTLnBbDbxs25352n2aEKbSn4VBnl-9wT4kD0KyCO3SBgxAefDN-_Y0lS1qUmREuwH-KQ4jhOff23a3TrMDE3keIMm212_aEvZCE7dABiuXx2B4wT4Qs5mL1wp--TriwseWwTkVz8TtXscXUcrhHLhhH1ck-6YX2hzj9KpOqL69BYp15PRG8C1kWh5mV8zPvfEUkggmuLmHzZknBefokRl3deKNdjEK0e6uRWE4ozm4kODP9TiPIHrcOlGTm0vV-FdvYsgTVa34j9lO4i6bOUbeWX5pdvjhVSmGhbg7CYZXbR0lkrq4D0BDYiXn93WgiCxBPV5Tb8Ffyc_f5bWPR4YpQomq39hlQo33KcfkQvFmQ4Hj0fFdaPIDfEgd567XOLSbgxJTPtOY-K0JQjJKTn9sMc9ybkz8_Eo0GAGSEPwFddzHDyLaE7ecY9vkT_VTu2C_jP31MKY2fq5ADlS75MISbioXzkH6KNlSJ-sMIv0R6nvi1AuYxvSBTKrFSETo97PMwVowJju16byyLnibT1Pw0jwX4L2URM1IymI3GfZ10ZVqOsRBBIG0kOqdsM0fA4JQJWwzz2r8gqLRq60Ei_eI2MfmLbBXyyMJemfBh1oZqUJPJWiTeKLIebo7gtqet6BBTc46F6EM8S'  // حط توكن MyFatoorah الحقيقي هنا
    });

    this.http.post('https://api-sa.myfatoorah.com/v2/SendPayment', paymentData, { headers }).subscribe({
      next: (res: any) => {
        console.log('استجابة ماي فاتورة:', res);

        if (!res) {
          console.error('استجابة ماي فاتورة فارغة');
          alert('تعذر الحصول على رابط الدفع');
          return;
        }

        if (res.IsSuccess && res.Data?.InvoiceURL) {
          window.location.href = res.Data.InvoiceURL;
        } else {
          console.error('فشل في إنشاء الفاتورة:', res.Message);
          alert(res.Message || 'تعذر إنشاء رابط الدفع');
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
        this.cartItems = response.data.items;

        this.totalPrice = this.cartItems.reduce(
          (sum, item) => sum + item.quantity * parseFloat(item.unit_price),
          0
        );

        this.totalSalePrice = this.cartItems.reduce(
          (sum, item) =>
            sum +
            (item.sale_unit_price
              ? item.quantity * parseFloat(item.sale_unit_price)
              : item.quantity * parseFloat(item.unit_price)),
          0
        );

        const totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
        this.cartState.updateCount(totalQuantity);
      },
      error: (err) => {
        console.error('Error loading cart', err);
      }
    });
  }
}