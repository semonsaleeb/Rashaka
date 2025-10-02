// compare-service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../models/Product';

@Injectable({
  providedIn: 'root'
})
export class CompareService {
  private readonly COMPARE_KEY = 'compare_products';
  private compareProducts: Product[] = [];
  private compareProductsSubject = new BehaviorSubject<Product[]>([]);
  
  public compareProducts$ = this.compareProductsSubject.asObservable();

  constructor() {
    this.loadCompareProducts();
  }

  addToCompare(product: Product): void {
    const productId = Number(product.id);
    
    if (this.isInCompare(product)) {
      alert('هذا المنتج مضاف بالفعل للمقارنة');
      return;
    }

    if (this.compareProducts.length >= 2) {
      alert('لا يمكنك إضافة أكثر من منتجين للمقارنة');
      return;
    }

    this.compareProducts.push(product);
    this.saveCompareProducts();
    
    if (this.compareProducts.length === 1) {
      alert('تم إضافة المنتج الأول، من فضلك اختر منتج آخر للمقارنة');
    }

    if (this.compareProducts.length === 2) {
      // يمكنك فتح البوب أب هنا إذا أردت
    }
  }

  removeFromCompare(productId: number): void {
    this.compareProducts = this.compareProducts.filter(p => Number(p.id) !== productId);
    this.saveCompareProducts();
  }

  isInCompare(product: Product): boolean {
    return this.compareProducts.some(p => Number(p.id) === Number(product.id));
  }

  getCompareProducts(): Product[] {
    return [...this.compareProducts];
  }

  clearCompare(): void {
    this.compareProducts = [];
    this.saveCompareProducts();
  }

  private loadCompareProducts(): void {
    try {
      const stored = localStorage.getItem(this.COMPARE_KEY);
      this.compareProducts = stored ? JSON.parse(stored) : [];
      this.compareProductsSubject.next(this.compareProducts);
    } catch (error) {
      console.error('Error loading compare products:', error);
      this.compareProducts = [];
    }
  }

  private saveCompareProducts(): void {
    try {
      localStorage.setItem(this.COMPARE_KEY, JSON.stringify(this.compareProducts));
      this.compareProductsSubject.next(this.compareProducts);
    } catch (error) {
      console.error('Error saving compare products:', error);
    }
  }
}