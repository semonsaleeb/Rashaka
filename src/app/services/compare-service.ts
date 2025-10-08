// compare-service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../models/Product';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class CompareService {
  private readonly COMPARE_KEY = 'compare_products';
  private compareProducts: Product[] = [];
  private compareProductsSubject = new BehaviorSubject<Product[]>([]);
  
  public compareProducts$ = this.compareProductsSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.loadCompareProducts();
  }

 addToCompare(product: Product): void {
    const productId = Number(product.id);

    // تحقق إذا كان المنتج مضاف بالفعل
    if (this.isInCompare(product)) {
      alert(this.translate.instant('COMPARE.ALREADY_ADDED'));
      return;
    }

    // الحد الأقصى منتجين فقط
    if (this.compareProducts.length >= 2) {
      alert(this.translate.instant('COMPARE.LIMIT_REACHED'));
      return;
    }

    // إضافة المنتج للمقارنة
    this.compareProducts.push(product);
    this.saveCompareProducts();

    // إذا تمت إضافة المنتج الأول فقط
    if (this.compareProducts.length === 1) {
      alert(this.translate.instant('COMPARE.FIRST_ADDED'));
    }

    // لو أضفت المنتج الثاني
    if (this.compareProducts.length === 2) {
      // يمكنك فتح نافذة المقارنة هنا مثلًا
      // this.openComparePopup();
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