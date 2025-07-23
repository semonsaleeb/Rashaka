// services/cart-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface PromoResponse {
  success: boolean;
  original_total: number;
  discount_amount: number;
  new_total: number;
  promocode: string;
}


@Injectable({ providedIn: 'root' })
export class CartStateService {
  private cartCountSource = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSource.asObservable();



  
  updateCount(count: number): void {
    this.cartCountSource.next(count);
  }
}


