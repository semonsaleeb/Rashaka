import { Component, OnInit } from '@angular/core';
import { CartStateService } from '../services/cart-state-service';
import { CartService } from '../services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-icon.component',
  imports: [CommonModule],
  templateUrl: './cart-icon.component.html',
  styleUrl: './cart-icon.component.scss'
})
export class CartIconComponent implements OnInit {
  cartCount = 0;
  showDropdown = false;
  cartItems: any[] = [];

  constructor(
    public cartState: CartStateService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.cartState.cartCount$.subscribe(count => this.cartCount = count);
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.cartService.getCart().subscribe(response => {
        this.cartItems = response.data.items;
      });
    }
  }
}


