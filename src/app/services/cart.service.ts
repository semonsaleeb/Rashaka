// cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string; 
  product_name_ar:string;     
  name: string;              
  name_ar: string;          
  description: string;      
  image: string;            
  images: string[];          

  price: number;             
  sale_price: number | null; 
  unit_price:string;
  sale_unit_price: string;   
  final_price: number;       
  line_total: number;        
  total_price?: string;     
  total_sale_price?: string; 

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

  // ✅ Place order
  placeOrder(address_id: number, payment_method: string, promocode?: string): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(
      `${this.apiUrl}/place-order`,
      { address_id, payment_method, promocode },
      { headers: this.getHeaders() }
    );
  }

  // ✅ Apply promocode
  applyPromocode(promocode: string, total_price: number): Observable<PromoResponse> {
    return this.http.post<PromoResponse>(
      `${this.apiUrl}/client/order/apply-promocode`,
      { promocode, total_price },
      { headers: this.getHeaders() }
    );
  }
}
