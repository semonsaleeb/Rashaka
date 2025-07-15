// import { Component, OnInit } from '@angular/core';
// import { CartStateService } from '../services/cart-state-service';
// import { CartService } from '../services/cart.service';

// @Component({
//   selector: 'app-cart-page.component',
//   imports: [],
//   templateUrl: './cart-page.component.html',
//   styleUrl: './cart-page.component.scss'
// })
// export class CartPageComponent implements OnInit {
//   cartCount = 0;
//   showDropdown = false;
//   cartItems: any[] = [];

//   constructor(
//     public cartState: CartStateService,
//     private cartService: CartService,
//   ) {}

//   ngOnInit(): void {
//     this.cartState.cartCount$.subscribe(count => this.cartCount = count);
//   }

//  toggleDropdown(): void {
//   this.showDropdown = !this.showDropdown;

//   if (this.showDropdown) {
//     this.cartService.getCart().subscribe({
//       next: (response) => {
//         this.cartItems = response.data?.items || [];
//       },
//       error: (err) => {
//         console.error('Failed to fetch cart items', err);
//         this.cartItems = [];
//       }
//     });
//   }
// }
// get totalCartPrice(): number {
//   return this.cartItems.reduce((total, item) =>
//     total + (parseFloat(item.sale_unit_price ?? item.unit_price) * item.quantity), 0
//   );
// }

// }