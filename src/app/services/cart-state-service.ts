// services/cart-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// ده بس مثال لو انت محتاجه مع الكارت
export interface PromoResponse {
  success: boolean;
  original_total: number;
  discount_amount: number;
  new_total: number;
  promocode: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  name_ar: string;
  product_name: string;
  product_name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  image: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartStateService {
  // 🟢 عدد المنتجات
  private cartCountSource = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSource.asObservable();

  // 🟢 كل المنتجات
  private cartItemsSource = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSource.asObservable();

  // ✅ تحديث العدد
  updateCount(count: number): void {
    this.cartCountSource.next(count);
  }

  // ✅ تحديث المنتجات كلها
  updateItems(items: CartItem[]): void {
    this.cartItemsSource.next(items);

    // كمان نحدث العدد أوتوماتيك
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    this.updateCount(count);
  }

  // ✅ reset cart (مثلاً عند تسجيل الخروج)
  clearCart(): void {
    this.cartItemsSource.next([]);
    this.cartCountSource.next(0);
  }
}
