import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';

@Component({
  selector: 'app-cart-page.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss']
})
export class CartPageComponent implements OnInit {
    progressValue = 60; // Set this dynamically based on logic

  cartItems: any[] = [];
  totalPrice = 0;
  totalSalePrice = 0;

  constructor(
    private cartService: CartService,
    private cartState: CartStateService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  hasDiscount(): boolean {
    return this.cartItems.some(item => item.sale_unit_price);
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
        (sum, item) => sum + (item.sale_unit_price ? item.quantity * parseFloat(item.sale_unit_price) : item.quantity * parseFloat(item.unit_price)),
        0
      );

      const totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
      this.cartState.updateCount(totalQuantity); // ✅ this updates header icon count
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

}
