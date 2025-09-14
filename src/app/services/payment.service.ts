// src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) {}

  // دفع عبر MyFatoorah
  initiatePayment(paymentData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.myFatoorahApiKey}`
    });

    return this.http.post(
      `${environment.myFatoorahBaseUrl}/v2/SendPayment`,
      paymentData,
      { headers }
    );
  }

  // الحصول على حالة الدفع
  getPaymentStatus(paymentId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.myFatoorahApiKey}`
    });

    return this.http.get(
      `${environment.myFatoorahBaseUrl}/v2/GetPaymentStatus`,
      { 
        headers,
        params: { Key: paymentId, KeyType: 'PaymentId' }
      }
    );
  }
}