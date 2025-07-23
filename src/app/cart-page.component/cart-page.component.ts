import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-cart-page.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss']
})
export class CartPageComponent implements OnInit {
  progressValue = 60;
  cartItems: any[] = [];
  totalPrice = 0;
  totalSalePrice = 0;
  addressId: number = 1;
  paymentMethod: string = 'cash';
  promoCode: string = '';
  token: string = '';

  constructor(
    private cartService: CartService,
    private cartState: CartStateService,
    private http: HttpClient
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data.items;

        this.totalPrice = this.cartItems.reduce(
          (sum, item) => sum + item.quantity * parseFloat(item.unit_price),
          0
        );

        this.totalSalePrice = this.cartItems.reduce(
          (sum, item) =>
            sum +
            (item.sale_unit_price
              ? item.quantity * parseFloat(item.sale_unit_price)
              : item.quantity * parseFloat(item.unit_price)),
          0
        );

        const totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
        this.cartState.updateCount(totalQuantity);
      },
      error: (err) => {
        console.error('Error loading cart', err);
      }
    });
  }

  increaseQuantity(productId: number) {
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: err => console.error(err)
    });
  }

  decreaseQuantity(productId: number) {
    this.cartService.reduceCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: err => console.error(err)
    });
  }

  removeItem(productId: number) {
    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: err => console.error(err)
    });
  }

  get totalCartItemsCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  hasDiscount(): boolean {
    return this.cartItems.some(item => item.sale_unit_price);
  }

  placeOrder() {
  const headers = new HttpHeaders({
    'Accept': 'application/json',
    'Authorization': `Bearer ${this.token}`
  });

  const body = {
    address_id: this.addressId,
    payment_method: this.paymentMethod,
    promocode: this.promoCode || undefined
  };

  console.log('📦 Sending order:', body);

  this.http.post(`${environment.apiBaseUrl}/place-order`, body, { headers })
    .subscribe({
      next: (res) => {
        console.log('✅ Order placed:', res);
        alert('تم إتمام الطلب بنجاح!');
      },
      error: (err) => {
        console.error('❌ Failed to place order', err);
        if (err.status === 422 && err.error?.message) {
          alert(`خطأ: ${err.error.message}`);
        } else {
          alert('حدث خطأ أثناء إتمام الطلب');
        }
      }
    });
}


  applyPromoCode() {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });

    const body = {
      promocode: this.promoCode,
      total_price: this.totalPrice
    };

    this.http.post<PromoResponse>(`${environment.apiBaseUrl}/order/apply-promocode`, body, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.totalSalePrice = res.new_total;
            alert(`تم تطبيق الكود: ${res.promocode}`);
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

// Define the response structure
interface PromoResponse {
  success: boolean;
  original_total: number;
  discount_amount: number;
  new_total: number;
  promocode: string;
}
