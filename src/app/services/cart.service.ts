// cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  sale_unit_price: number | null;
  total_price: number;
  total_sale_price: number | null;
  stock: number;
}

interface CartResponse {
  items: CartItem[];
  cart_total: number;
  sale_cart_total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/add`, 
      { product_id: productId, quantity },
      { headers: this.getHeaders() }
    );
  }

  getCart(): Observable<{ status: string; data: CartResponse }> {
    return this.http.get<{ status: string; data: CartResponse }>(
      `${this.apiUrl}/cart`,
      { headers: this.getHeaders() }
    );
  }

  reduceCartItem(productId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/cart/reduce`,
      { product_id: productId },
      { headers: this.getHeaders() }
    );
  }

  removeCartItem(productId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/cart/remove`,
      { product_id: productId },
      { headers: this.getHeaders() }
    );
  }
}