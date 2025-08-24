// cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_name_ar: string;
  name: string;
  name_ar: string;
  description: string;
  image: string;
  images: string[];

  price: string;
  sale_price: string | null;
  unit_price: string;
  sale_unit_price: string;
  final_price: string;
  line_total: number;
  total_price?: string;
  total_sale_price?: string;
  description_ar?: string;
  quantity: number;
  stock_quantity?: number;
  stock?: number;
  isFavorite?: boolean;
}

export interface CartResponse {
  items: CartItem[];
  totalPrice: number;
  totalQuantity: number;
  totalSalePrice?: number;
}



export interface PlaceOrderResponse {
  status: string;
  message: string;
  order_id: number;
  address_id: number;
  payment_method: string;
  order_status: string;
  total_price: number;
  discount: number;
  promocode: string | null;
  items: any[];
}

export interface PromoResponse {
  success: boolean;
  original_total: number;
  discount_amount: number;
  new_total: number;
  promocode: string;
}
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
      'Authorization': `Bearer ${token}`
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

  getGuestCart(): CartResponse {
    const items = this.loadGuestCart();

    const totalPrice = items.reduce((sum, i) => {
      const unitPriceNum = parseFloat(i.unit_price as any) || 0;
      return sum + unitPriceNum * i.quantity;
    }, 0);

    const totalSalePrice = items.reduce((sum, i) => {
      const finalPriceNum = parseFloat(i.final_price as any) || 0;
      return sum + finalPriceNum * i.quantity;
    }, 0);

    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, totalPrice, totalSalePrice, totalQuantity };
  }

  /** ----------------- COUNT HELPERS ----------------- */
  getGuestCartCount(): number {
    const items = this.loadGuestCart();
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getCartCount(): number {
    // حالياً بيرجع عدد الـ guest cart
    // تقدر تطوره بعدين إنه يشيك لو فيه user logged in يجيب العدد من API
    return this.getGuestCartCount();
  }

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

  /** ----------------- API (للي عامل Login) ----------------- */
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
}
