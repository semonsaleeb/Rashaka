// cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
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

  // جوه الكلاس
 /** ----------------- HELPER ----------------- */
private parsePrice(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/** ----------------- NORMALIZE CART ITEM ----------------- */
private normalizeItem(item: any, isGuest: boolean): CartItem {
  const quantity = item.quantity ?? 1;

  if (isGuest) {
    // Guest user → data comes from localStorage
    const price = this.parsePrice(item.unit_price);
    const sale_price = this.parsePrice(item.sale_unit_price);

    return {
      id: item.id ?? 0,
      product_id: item.product_id,
      product_name: item.product_name ?? 'منتج بدون اسم',
      product_name_ar: item.product_name_ar ?? 'منتج بدون اسم',
      images: item.images ?? [],
      quantity,
      price,
      sale_price,
      total_price: price * quantity,
      total_price_after_offers: (sale_price || price) * quantity,
      final_price: String(sale_price || price),
      unit_price_after_offers: String(sale_price || price),
    };
  } else {
    // Logged-in user → data comes from API
    const price = this.parsePrice(item.price);
    const sale_price = this.parsePrice(item.sale_price ?? item.price);
    const quantityAPI = item.cart_quantity ?? 1;

    return {
      id: item.id ?? 0,
      product_id: item.id ?? 0,
      product_name: item.name ?? 'منتج بدون اسم',
      product_name_ar: item.name_ar ?? 'منتج بدون اسم',
      images: item.images ?? [],
      quantity: quantityAPI,
      price,
      sale_price,
      total_price: price * quantityAPI,
      total_price_after_offers: sale_price * quantityAPI,
      final_price: String(sale_price),
      unit_price_after_offers: String(sale_price),
    };
  }
}




  getGuestCart(): CartResponse {
    const rawItems = this.loadGuestCart();
    const items = rawItems.map(i => this.normalizeItem(i, true));

    const cart_total = items.reduce((sum, i) => sum + Number(i.total_price), 0);
    const sale_cart_total = items.reduce((sum, i) => sum + Number(i.total_price_after_offers), 0);
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, cart_total, sale_cart_total, totalQuantity };
  }

  getCart(): Observable<{ status: string; data: CartResponse }> {
    return this.http.get<{ status: string; data: CartResponse }>(
      `${this.apiUrl}/cart`,
      { headers: this.getHeaders().set('Accept', 'application/json') }
    );
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
  // 1️⃣ تحميل الكارت الحالي من localStorage
  const cart = this.loadGuestCart();

  // 2️⃣ Normalize للمنتج الجديد
  const normalizedProduct = this.normalizeItem(product, true);

  // 3️⃣ البحث عن المنتج لو موجود
  const existing = cart.find(i => i.product_id === normalizedProduct.product_id);

  if (existing) {
    // ✅ تأكد من أن جميع القيم أرقام قبل الضرب
    const price = Number(normalizedProduct.price) || 0;
    const salePrice = Number(normalizedProduct.sale_price) || 0;
    const quantity = Number(existing.quantity) || 0;

    // ✅ تحديث القيم الرقمية
    existing.quantity += quantity;
    existing.total_price = price * existing.quantity;
    existing.total_price_after_offers = salePrice * existing.quantity;
    existing.final_price = String(salePrice);
    existing.unit_price_after_offers = String(salePrice);
  } else {
    cart.push(normalizedProduct);
  }

  // 4️⃣ حفظ الكارت بعد التعديل
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


  reduceCartItem(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/reduce`, { product_id: productId },
      { headers: this.getHeaders() });
  }

  removeCartItem(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/remove`, { product_id: productId },
      { headers: this.getHeaders() });
  }

  // placeOrder(address_id: number, payment_method: string, promocode?: string): Observable<PlaceOrderResponse> {
  //   return this.http.post<PlaceOrderResponse>(`${this.apiUrl}/place-order`,
  //     { address_id, payment_method, promocode }, { headers: this.getHeaders() });
  // }



  placeOrder(
    addressId: number,
    paymentMethod: string,
    promocode?: string,
    applyFreeBalance: boolean = false,
    freeBalanceAmount: number = 0
  ): Observable<any> {
    // إعداد الـ params
    let params = new HttpParams()
      .set('address_id', addressId)
      .set('payment_method', paymentMethod);

    if (promocode && promocode.trim() !== '') {
      params = params.set('promocode', promocode);
    }

    if (applyFreeBalance) {
      params = params
        .set('apply_free_balance', 'true')
        .set('free_balance_amount', freeBalanceAmount.toString());
    }

    // إعداد الـ headers (لو مطلوب authorization)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // إرسال الريكوست
    return this.http.post(`${this.apiUrl}/submit`, {}, { params, headers });
  }


// Add this method to check payment status when user returns from MyFatoorah
checkPaymentStatus(orderId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/orders/${orderId}/status`);
}

  applyPromocode(promocode: string, total_price: number): Observable<PromoResponse> {
    return this.http.post<PromoResponse>(`${this.apiUrl}/order/apply-promocode`,
      { promocode, total_price }, { headers: this.getHeaders() });
  }

updateQuantity(productId: number, quantity: number): Observable<any> {
  const token = localStorage.getItem('token');

  if (!token) {
    // Guest → localStorage
    this.updateGuestQuantity(productId, quantity);
    return of(true);
  }

  // Logged-in user
  const currentCart$ = this.getCart(); // تجيب الكارت من السيرفر الأول
  return new Observable(observer => {
    currentCart$.subscribe({
      next: (cartResponse) => {
        const item = cartResponse.data.items.find(i => i.product_id === productId);
        const currentQty = item?.quantity ?? 0;

        if (quantity > currentQty) {
          // ✅ لو عايز تزود
          const diff = quantity - currentQty;
          this.addToCart(productId, diff).subscribe(observer);
        } else if (quantity < currentQty) {
          // ✅ لو عايز تقلل
          const diff = currentQty - quantity;
          let chain$ = of(null);

          for (let i = 0; i < diff; i++) {
            chain$ = chain$.pipe(
              switchMap(() => this.reduceCartItem(productId))
            );
          }

          chain$.subscribe(observer);
        } else {
          observer.next(true); // no change
          observer.complete();
        }
      },
      error: (err) => observer.error(err)
    });
  });
}

}
