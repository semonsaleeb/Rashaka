import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-place-order',
  templateUrl: './place-order.html',
  styleUrls: ['./place-order.scss'],
  standalone: true,
  imports: [] // Add Angular modules if needed
})
export class PlaceOrder {
  token: string = ''; // Should be retrieved from auth service or localStorage
  addressId: number = 1; // Example value
  paymentMethod: string = 'cash'; // or 'card'
  promoCode: string = ''; // Optional
  progressValue = 60;

  constructor(private http: HttpClient) {
    // Example: Get token from localStorage
    this.token = localStorage.getItem('token') || '';
  }

  placeOrder(): void {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });

    const body: any = {
      address_id: this.addressId,
      payment_method: this.paymentMethod
    };

    if (this.promoCode) {
      body.promocode = this.promoCode;
    }

    console.log('📦 Sending order:', body);

    this.http.post(`${environment.apiBaseUrl}/place-order`, body, { headers })
      .subscribe({
        next: (res) => {
          console.log('✅ Order placed:', res);
          alert('تم إتمام الطلب بنجاح!');
        },
        error: (err) => {
          console.error('❌ Failed to place order', err);
          if (err.status === 422 && err.error?.message) {
            alert(`خطأ: ${err.error.message}`);
          } else {
            alert('حدث خطأ أثناء إتمام الطلب');
          }
        }
      });
  }
}
