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
      `${this.baseUrl}/order/${orderId}`, // ✅ لاحظ client/order
      { headers }
    )
    .pipe(map(res => res.order));
}

}
