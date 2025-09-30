import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment-callback',
  template: `
    <div class="container text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">جاري المعالجة...</span>
      </div>
      <p class="mt-3">جاري تأكيد حالة الدفع، يرجى الانتظار...</p>
    </div>
  `
})
export class PaymentCallback implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.handlePaymentCallback();
  }

  private handlePaymentCallback() {
    this.route.queryParams.subscribe(params => {
      const paymentId = params['paymentId'] || params['Id'];
      
      if (!paymentId) {
        this.router.navigate(['/payment-failed'], {
          queryParams: { error: 'معرف الدفع غير موجود' }
        });
        return;
      }

      console.log('🔄 Processing MyFatoorah callback:', paymentId);

      // التحقق من حالة الدفع
      this.checkPaymentStatus(paymentId);
    });
  }

  private checkPaymentStatus(paymentId: string) {
    const token = localStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    this.http.get(`${environment.apiBaseUrl}/checkout/myfatoorah/status/${paymentId}`, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Payment status response:', response);
          this.handlePaymentResult(response);
        },
        error: (error) => {
          console.error('❌ Error checking payment status:', error);
          this.router.navigate(['/payment-failed'], {
            queryParams: { error: 'تعذر التحقق من حالة الدفع' }
          });
        }
      });
  }

  private handlePaymentResult(response: any) {
    // تنظيف البيانات المؤقتة
    localStorage.removeItem('pendingPayment');
    
    if (response.status === 'success' && response.data?.invoice_status === 'Paid') {
      // ✅ الدفع ناجح
      this.router.navigate(['/payment-success'], {
        state: { data: response.data },
        queryParams: {
          orderId: response.data.order_id,
          invoiceId: response.data.invoice_id
        }
      });
    } else if (response.status === 'requires_payment_action') {
      // ⚠️ مازال يحتاج دفع
      this.router.navigate(['/checkout'], {
        queryParams: { 
          error: 'لم تكتمل عملية الدفع',
          orderId: response.data?.order_id
        }
      });
    } else {
      // ❌ فشل الدفع
      this.router.navigate(['/payment-failed'], {
        queryParams: {
          orderId: response.data?.order_id,
          error: response.message || 'فشل عملية الدفع'
        }
      });
    }
  }
}