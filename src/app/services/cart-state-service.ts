// services/cart-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../../models/CartItem';

@Injectable({ providedIn: 'root' })
export class CartStateService {
  // 🟢 عدد المنتجات في الكارت

  private parsePrice(value: string | number | undefined): number {
  const num = Number(value?.toString().replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

  private cartCountSource = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSource.asObservable();

  // 🟢 كل المنتجات في الكارت
  private cartItemsSource = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSource.asObservable();

  // 🟢 إجمالي السعر
  private cartTotalSource = new BehaviorSubject<number>(0);
  cartTotal$ = this.cartTotalSource.asObservable();

  // 🟢 إجمالي السعر بعد الخصم
  private saleCartTotalSource = new BehaviorSubject<number>(0);
  saleCartTotal$ = this.saleCartTotalSource.asObservable();

  constructor() {}

  /** ✅ تحديث العدد مباشرة */
  updateCount(count: number): void {
    this.cartCountSource.next(count);
  }

  /** ✅ تحديث المنتجات كلها (ويحسب العدد والإجمالي تلقائي) */
  updateItems(items: CartItem[]): void {
    this.cartItemsSource.next(items);

    // 🟢 العدد الكلي
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    this.updateCount(totalQuantity);

    // 🟢 الإجمالي
    const cart_total = items.reduce(
      (sum, item) =>
        sum + Number(item.unit_price ?? item.price ?? 0) * item.quantity,
      0
    );
    this.cartTotalSource.next(cart_total);

    // 🟢 الإجمالي بعد الخصم
    const sale_cart_total = items.reduce(
      (sum, item) =>
        sum + Number(item.final_price ?? item.price ?? 0) * item.quantity,
      0
    );
    this.saleCartTotalSource.next(sale_cart_total);
  }

  /** ✅ تحديث عنصر واحد بس */
  updateSingleItem(updatedItem: CartItem): void {
    const currentItems = this.cartItemsSource.getValue();
    const index = currentItems.findIndex(
      (i) => i.product_id === updatedItem.product_id
    );

    if (index > -1) {
      currentItems[index] = { ...currentItems[index], ...updatedItem };
    } else {
      currentItems.push(updatedItem);
    }

    this.updateItems([...currentItems]);
  }

  /** ✅ حذف عنصر من الكارت */
  removeItem(productId: number): void {
    const currentItems = this.cartItemsSource.getValue();
    const newItems = currentItems.filter((i) => i.product_id !== productId);
    this.updateItems(newItems);
  }

  /** ✅ إفراغ الكارت */
  clearCart(): void {
    this.cartItemsSource.next([]);
    this.cartCountSource.next(0);
    this.cartTotalSource.next(0);
    this.saleCartTotalSource.next(0);
  }

  /** ✅ ملخص الكارت (زي الـ API) */
  getCartSummary() {
    const items = this.cartItemsSource.getValue();
    const cart_total = this.cartTotalSource.getValue();
    const sale_cart_total = this.saleCartTotalSource.getValue();
    const totalQuantity = this.cartCountSource.getValue();

    return { items, cart_total, sale_cart_total, totalQuantity };
  }
}
