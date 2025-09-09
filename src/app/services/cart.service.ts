// cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem } from '../../models/CartItem';
import { CartResponse } from '../../models/CartResponse';
import { PlaceOrderResponse } from '../../models/PlaceOrderResponse';
import { PromoResponse } from '../../models/PromoResponse';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiBaseUrl;
  private localKey = 'guest_cart'; // 👈 مفتاح التخزين المحلي

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  /** ----------------- LOCAL STORAGE ----------------- */
  private loadGuestCart(): CartItem[] {
    const data = localStorage.getItem(this.localKey);
    return data ? JSON.parse(data) : [];
  }

  private saveGuestCart(items: CartItem[]) {
    localStorage.setItem(this.localKey, JSON.stringify(items));
  }

  /** ----------------- GUEST CART RESPONSE ----------------- */
getGuestCart(): CartResponse {
  const items = this.loadGuestCart().map(i => {
    const unit_price = Number(i.unit_price ?? "0");
    const final_price = Number(i.final_price ?? "0");

    return {
      ...i,
      unit_price: unit_price.toString(),
      final_price: final_price.toString(),
      total_price: (unit_price * i.quantity).toString(),
      total_sale_price: (final_price * i.quantity).toString()
    };
  });

  const cart_total = items.reduce((sum, i) => sum + Number(i.total_price), 0);
  const sale_cart_total = items.reduce((sum, i) => sum + Number(i.total_sale_price), 0);
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, cart_total, sale_cart_total, totalQuantity };
}



  /** ----------------- COUNT HELPERS ----------------- */
  getGuestCartCount(): number {
    const items = this.loadGuestCart();
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getCartCount(): number {
    // حالياً بيرجع عدد الـ guest cart
    // ممكن تطوره بعدين يشيك إذا كان فيه مستخدم logged in
    return this.getGuestCartCount();
  }

  /** ----------------- GUEST CART ACTIONS ----------------- */
  addGuestItem(product: CartItem) {
    const cart = this.loadGuestCart();
    const existing = cart.find(i => i.product_id === product.product_id);
    if (existing) {
      existing.quantity += product.quantity;
    } else {
      cart.push(product);
    }
    this.saveGuestCart(cart);
  }

  updateGuestQuantity(productId: number, quantity: number) {
    const cart = this.loadGuestCart();
    const item = cart.find(i => i.product_id === productId);
    if (item) item.quantity = Math.max(1, quantity);
    this.saveGuestCart(cart);
  }

  removeGuestItem(productId: number) {
    const cart = this.loadGuestCart().filter(i => i.product_id !== productId);
    this.saveGuestCart(cart);
  }

  clearGuestCart() {
    localStorage.removeItem(this.localKey);
  }

  /** ----------------- API CART (للي عامل Login) ----------------- */
  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/add`,
      { product_id: productId, quantity },
      { headers: this.getHeaders() }
    );
  }

  getCart(): Observable<{ status: string; data: CartResponse }> {
    return this.http.get<{ status: string; data: CartResponse }>(
      `${this.apiUrl}/cart`,
      { headers: this.getHeaders().set('Accept', 'application/json') }
    );
  }

  reduceCartItem(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/reduce`, { product_id: productId },
      { headers: this.getHeaders() });
  }

  removeCartItem(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/remove`, { product_id: productId },
      { headers: this.getHeaders() });
  }

  placeOrder(address_id: number, payment_method: string, promocode?: string): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(`${this.apiUrl}/place-order`,
      { address_id, payment_method, promocode }, { headers: this.getHeaders() });
  }

  applyPromocode(promocode: string, total_price: number): Observable<PromoResponse> {
    return this.http.post<PromoResponse>(`${this.apiUrl}/client/order/apply-promocode`,
      { promocode, total_price }, { headers: this.getHeaders() });
  }

  updateQuantity(productId: number, quantity: number): Observable<any> {
    const token = localStorage.getItem('token');

    if (token) {
      // مستخدم مسجل دخول
      return this.http.post(`${this.apiUrl}/cart/update-quantity`,
        { product_id: productId, quantity },
        { headers: this.getHeaders() }
      );
    } else {
      // ضيف → تحديث localStorage
      this.updateGuestQuantity(productId, quantity);
      return of(true); // ✅ علشان الكومبوننت يكمل
    }
  }
}
