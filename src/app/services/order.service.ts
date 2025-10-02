// // src/app/services/order.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { environment } from '../../environments/environment';
// import { Observable, map } from 'rxjs';
// import { Order } from '../../models/Order';


// @Injectable({
//   providedIn: 'root'
// })
// export class OrderService {
//   private readonly baseUrl = environment.apiBaseUrl;

//   constructor(private http: HttpClient) {}

//   // Get all orders
//   getOrders(token: string): Observable<Order[]> {
//     const headers = new HttpHeaders({
//       Accept: 'application/json',
//       Authorization: `Bearer ${token}`
//     });

//     return this.http
//       .get<{ status: string; orders: Order[] }>(`${this.baseUrl}/orders`, { headers })
//       .pipe(map(res => res.orders));
//   }

//   // Get order details
// getOrderById(orderId: number, token: string): Observable<any> {
//   const headers = new HttpHeaders({
//     'Accept': 'application/json',
//     'Authorization': `Bearer ${token}`
//   });

//   return this.http
//     .get<{ status: string; order: any }>(
//       `${this.baseUrl}/order/${orderId}`, // ✅ لاحظ client/order
//       { headers }
//     )
//     .pipe(map(res => res.order));
// }

// }



// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { Order } from '../../models/Order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Get all orders
  getOrders(token: string): Observable<Order[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    });

    return this.http
      .get<{ status: string; orders: Order[] }>(`${this.baseUrl}/orders`, { headers })
      .pipe(map(res => res.orders));
  }

  // Get order details
  getOrderById(orderId: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http
      .get<{ status: string; order: any }>(
        `${this.baseUrl}/order/${orderId}`,
        { headers }
      )
      .pipe(map(res => res.order));
  }

  // Place a new order
// src/app/services/order.service.ts
placeOrder(
  addressId: number,
  paymentMethod: string,
  promoCode: string = '',
  applyFreeBalance: boolean = false,
  freeBalanceAmount: number = 0
): Observable<any> {
  const token = localStorage.getItem('token') || '';
  const headers = new HttpHeaders({
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const body = {
    address_id: addressId,
    payment_method: paymentMethod,
    promo_code: promoCode,                // ✅ خليها promo_code مش promocode
    apply_free_balance: applyFreeBalance ? 1 : 0, // ✅ 0 أو 1
    free_balance_amount: freeBalanceAmount
  };

  return this.http.post(`${this.baseUrl}/checkout/submit`, body, { headers });
}




  // src/app/services/order.service.ts
updateOrderStatus(orderId: number, status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled'): Observable<any> {
  const token = localStorage.getItem('token') || '';
  const headers = new HttpHeaders({
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const body = {
    order_id: orderId,
    status: status
  };

  return this.http.post(`${this.baseUrl}/order/update-status`, body, { headers });
}

}