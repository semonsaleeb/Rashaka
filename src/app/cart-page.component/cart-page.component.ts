import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CartService,
  PromoResponse as ServicePromoResponse,
  PlaceOrderResponse,
  CartResponse,
  CartItem
} from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart-page.component',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule ],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss']
})
export class CartPageComponent implements OnInit {
  progressValue = 80;
  cartItems: CartItem[] = [];
  totalPrice: number = 0;             // original total (no sale)
  totalSalePrice: number | null = 0;  // final total after sales/promos
  addressId: number = 1;
  paymentMethod: string = 'cash';
  promoCode: string = '';
  token: string = '';
isLoading = false;

  constructor(
    private cartService: CartService,
    private cartState: CartStateService,
    private http: HttpClient,
    private router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.loadCart();
  }

  // helper: safe number conversion
  private toNumber(value: any): number {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

loadCart() {
  this.cartService.getCart().subscribe({
    next: (response) => {
      const data: CartResponse = response?.data || {
        items: [],
        totalPrice: 0,
        totalQuantity: 0
      };

      const items: CartItem[] = Array.isArray(data.items) ? data.items : [];

      let totalPrice = 0;
      let totalSalePrice = 0;
      let totalQuantity = 0;

      this.cartItems = items.map((item) => {
        console.log('Cart Item:', item);

        const unitPriceNum = parseFloat(item.unit_price) || 0;
        const saleUnitPriceNum = parseFloat(item.sale_unit_price) || 0;
        const finalPrice = saleUnitPriceNum > 0 ? saleUnitPriceNum : unitPriceNum;

        // المجموع العادي
        totalPrice += unitPriceNum * item.quantity;

        // المجموع المخفض (ولو مفيش تخفيض يحسب العادي)
        totalSalePrice += finalPrice * item.quantity;

        totalQuantity += item.quantity;

        return {
          ...item,
          nameAr: item.product_name_ar || 'منتج بدون اسم',
          unitPriceNum,
          saleUnitPriceNum,
          finalPrice
        };
      });

      this.totalPrice = totalPrice;
      this.totalSalePrice = totalSalePrice; // دايمًا هيكون فيه قيمة حتى لو مفيش عرض
      this.progressValue = Math.min(
        (this.totalSalePrice / 1000) * 100,
        100
      );
    },
    error: (err) => {
      console.error('Error loading cart:', err);
    }
  });
}




  increaseQuantity(productId: number) {
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error(err)
    });
  }

  decreaseQuantity(productId: number) {
    this.cartService.reduceCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error(err)
    });
  }

  removeItem(productId: number) {
    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error(err)
    });
  }

  get totalCartItemsCount(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
  }

  hasDiscount(): boolean {
    return this.cartItems.some(
      (item) => !!item.sale_price && item.sale_price > 0
    );
  }

  placeOrder() {
      this.router.navigate(['/placeOrder']);

   
  }

  applyPromoCode() {
    if (!this.promoCode || this.promoCode.trim() === '') {
      alert('أدخل كود الخصم أولًا');
      return;
    }

    const currentTotalToSend =
      this.totalPrice || this.totalSalePrice || 0;

    this.cartService
      .applyPromocode(this.promoCode, currentTotalToSend)
      .subscribe({
        next: (res: ServicePromoResponse) => {
          if (res.success) {
            this.totalSalePrice = this.toNumber(res.new_total);
            this.totalPrice = this.toNumber(res.original_total);
            alert(
              `تم تطبيق الكود: ${res.promocode} - خصم ${res.discount_amount}`
            );
          } else {
            alert('رمز الخصم غير صالح');
          }
        },
        error: (err) => {
          console.error('Promo error:', err);
          alert('حدث خطأ أثناء تطبيق الكود');
        }
      });
  }
}
