// services/cart-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../../models/CartItem';






@Injectable({ providedIn: 'root' })
export class CartStateService {
  // 🟢 عدد المنتجات في الكارت
  private cartCountSource = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSource.asObservable();

  // 🟢 كل المنتجات في الكارت
  private cartItemsSource = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSource.asObservable();

  constructor() {}

  // ✅ تحديث العدد مباشرة
  updateCount(count: number): void {
    this.cartCountSource.next(count);
  }

  // ✅ تحديث المنتجات كلها (ويحسب العدد تلقائي)
  updateItems(items: CartItem[]): void {
    this.cartItemsSource.next(items);

    // 🟢 نحسب العدد الكلي من الكميات
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    this.updateCount(totalQuantity);
  }

  // ✅ تحديث عنصر واحد بس (مفيد للزيادة/النقصان)
  updateSingleItem(updatedItem: CartItem): void {
    const currentItems = this.cartItemsSource.getValue();
    const index = currentItems.findIndex(i => i.product_id === updatedItem.product_id);

    if (index > -1) {
      currentItems[index] = { ...currentItems[index], ...updatedItem };
    } else {
      currentItems.push(updatedItem);
    }

    this.updateItems([...currentItems]);
  }

  // ✅ حذف عنصر من الكارت
  removeItem(productId: number): void {
    const currentItems = this.cartItemsSource.getValue();
    const newItems = currentItems.filter(i => i.product_id !== productId);
    this.updateItems(newItems);
  }

  // ✅ reset cart (مثلاً عند تسجيل الخروج أو إفراغ الكارت)
  clearCart(): void {
    this.cartItemsSource.next([]);
    this.cartCountSource.next(0);
  }
}
