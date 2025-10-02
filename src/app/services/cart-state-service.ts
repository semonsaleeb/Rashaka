// services/cart-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../../models/CartItem';

@Injectable({ providedIn: 'root' })
export class CartStateService {
  constructor() {
    // ✅ تحميل الكارت من localStorage عند بداية الخدمة
    const savedCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    if (savedCart.length > 0) {
      this.updateItems(savedCart);
    }
  }

  /** 🟢 Helper: تحويل أي سعر لرقم */
  private parsePrice(value: string | number | undefined): number {
    if (value === null || value === undefined) return 0;
    const num = Number(value.toString().replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  }

  /** 🟢 Normalizer: توحيد شكل CartItem حسب API */
  private normalizeCartItem(item: any): CartItem {
    const quantity = Number(item.quantity ?? 1);

    const unit_price = this.parsePrice(
      item.unit_price ?? item.price ?? item.original_price
    );
    const sale_unit_price = this.parsePrice(
      item.sale_unit_price ?? item.price_after ?? item.sale_price ?? unit_price
    );
    const unit_price_after_offers = this.parsePrice(
      item.unit_price_after_offers ?? sale_unit_price ?? unit_price
    );

    return {
      id: Number(item.id) || 0,
      product_id: Number(item.product_id ?? item.id) || 0,
      product_name: item.product_name ?? item.name ?? '',
      product_name_ar: item.product_name_ar ?? item.name_ar ?? '',
      images: Array.isArray(item.images) ? item.images : [],
      quantity,

      // 🟢 الأسعار
      price: unit_price,
      sale_price: sale_unit_price,
      unit_price: unit_price,
      unit_price_after_offers: unit_price_after_offers.toString(),

      // 🟢 الإجماليات
      total_price: this.parsePrice(item.total_price) || unit_price * quantity,
      total_price_after_offers:
        this.parsePrice(item.total_price_after_offers) ||
        unit_price_after_offers * quantity,

      // 🟢 السعر النهائي
      final_price: unit_price_after_offers.toString(),
    };
  }

  // 🟢 عدد المنتجات
  private cartCountSource = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSource.asObservable();

  // 🟢 كل المنتجات
  private cartItemsSource = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSource.asObservable();

  // 🟢 إجمالي السعر
  private cartTotalSource = new BehaviorSubject<number>(0);
  cartTotal$ = this.cartTotalSource.asObservable();

  // 🟢 إجمالي السعر بعد الخصم
  private saleCartTotalSource = new BehaviorSubject<number>(0);
  saleCartTotal$ = this.saleCartTotalSource.asObservable();

  /** ✅ تحديث العدد */
  updateCount(count: number): void {
    this.cartCountSource.next(count);
  }

  /** ✅ تحديث المنتجات كلها (ويتحسب العدد والإجماليات) */
  updateItems(items: any[]): void {
    const normalized = items.map((i) => this.normalizeCartItem(i));
    this.cartItemsSource.next(normalized);

    // 🟢 العدد الكلي
    const totalQuantity = normalized.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    this.updateCount(totalQuantity);

    // 🟢 الإجمالي
    const cart_total = normalized.reduce(
      (sum, item) => sum + (Number(item.unit_price || 0) * (item.quantity || 0)),
      0
    );
    this.cartTotalSource.next(cart_total);

    // 🟢 الإجمالي بعد الخصم
    const sale_cart_total = normalized.reduce(
      (sum, item) =>
        sum + (Number(item.unit_price_after_offers || 0) * (item.quantity || 0)),
      0
    );
    this.saleCartTotalSource.next(sale_cart_total);

    // ✅ حفظ في localStorage
    localStorage.setItem('guest_cart', JSON.stringify(normalized));
  }

  /** ✅ إضافة منتج للكارت */
  addToCart(product: any, quantity: number = 1): void {
    const currentItems = this.cartItemsSource.getValue();
    const existing = currentItems.find((i) => i.product_id === product.id);

    if (existing) {
      existing.quantity += quantity;
      this.updateItems([...currentItems]);
    } else {
      const newItem = {
        ...product,
        product_id: product.id,
        quantity,
      };
      this.updateItems([...currentItems, newItem]);
    }
  }

  /** ✅ تحديث عنصر واحد */
  updateSingleItem(updatedItem: any): void {
    const normalizedItem = this.normalizeCartItem(updatedItem);
    const currentItems = this.cartItemsSource.getValue();
    const index = currentItems.findIndex(
      (i) => i.product_id === normalizedItem.product_id
    );

    if (index > -1) {
      currentItems[index] = { ...currentItems[index], ...normalizedItem };
    } else {
      currentItems.push(normalizedItem);
    }

    this.updateItems([...currentItems]);
  }

  /** ✅ حذف عنصر */
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
    localStorage.removeItem('guest_cart');
  }

  /** ✅ ملخص الكارت */
  getCartSummary() {
    const items = this.cartItemsSource.getValue();
    const cart_total = this.cartTotalSource.getValue();
    const sale_cart_total = this.saleCartTotalSource.getValue();
    const totalQuantity = this.cartCountSource.getValue();

    return { items, cart_total, sale_cart_total, totalQuantity };
  }
}
