import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ProductService } from '../services/product';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { FavoriteService } from '../services/favorite.service';
import { FormsModule } from '@angular/forms';
import { Downloadapp } from '../pages/home/downloadapp/downloadapp';
import { Product } from '../services/product';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule, Downloadapp],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss'
})
export class Favorites implements OnInit {
  cartItems: any[] = [];
  favorites: Product[] = [];
  isLoading = true;

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    public router: Router,
    private cartService: CartService,
    public cartState: CartStateService,
    private route: ActivatedRoute,
    private favoriteService: FavoriteService
  ) { }

  ngOnInit(): void {
    this.loadFavorites();
    this.loadCart();
  }

 loadFavorites(): void {
  const token = localStorage.getItem('token');
  if (!token) {
    this.isLoading = false;
    return;
  }

  this.favoriteService.loadFavorites(token).subscribe({
    next: favorites => {
      this.favorites = favorites;
      this.favoriteService.setFavorites(favorites); // ✅ This updates the count observable
      this.isLoading = false;
    },
    error: err => {
      console.error('Error loading favorites:', err);
      this.isLoading = false;
      if (err.status === 401) {
        this.auth.logout();
      }
    }
  });
}


removeFromFavorites(product: Product): void {
  if (!this.isLoggedIn()) {
    this.router.navigate(['/auth/login']);
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) return;

  product.isFavorite = true; // trigger removal

  this.favoriteService.toggleFavorite(product, token).subscribe({
    next: () => {
      this.loadFavorites(); // ✅ refresh the list after removing
    },
    error: err => {
      console.error('Error removing favorite:', err);
    }
  });
}



  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  addToCart(productId: number): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: (err: HttpErrorResponse) => this.handleCartActionError(err)
    });
  }

  private loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => this.handleCartResponse(response),
      error: (err: HttpErrorResponse) => this.handleCartError(err)
    });
  }

  isInCart(productId: number): boolean {
    return this.cartItems.some(item => Number(item.product_id) === Number(productId));
  }

  getCartItem(productId: number): any {
    return this.cartItems.find(item => Number(item.product_id) === Number(productId));
  }

  increaseQuantity(productId: number): void {
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error('Error increasing quantity:', err)
    });
  }

  decreaseQuantity(productId: number): void {
    this.cartService.reduceCartItem(productId).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error('Error decreasing quantity:', err)
    });
  }

  private handleCartResponse(response: any): void {
    this.cartItems = response.data?.items || [];
    const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(total);
  }

  private handleCartError(err: HttpErrorResponse): void {
    console.error('Error loading cart:', err);
    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    } else {
      this.resetCartState();
    }
  }

  private handleCartActionError(err: HttpErrorResponse): void {
    console.error('Cart action failed:', err);
    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    }
  }

  private resetCartState(): void {
    this.cartItems = [];
    this.cartState.updateCount(0);
  }
}
