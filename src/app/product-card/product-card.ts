import { Component, inject, OnInit } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Product, ProductService } from '../services/product';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule
],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCard implements OnInit {
  product!: Product;
  isLoading = true;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private auth: AuthService,
    private cartService: CartService,
    public cartState: CartStateService
  ) {}

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (productId) {
      this.getProduct(productId);
    }
  }

getProduct(id: number): void {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  });

  this.http.get<{ data: Product[] }>(`${environment.apiBaseUrl}/products`, {
    headers,
    params: { product_id: id.toString() }
  }).subscribe({
    next: (res) => {
      const foundProduct = res.data.find(p => p.id === id);
      if (foundProduct) {
        this.product = foundProduct;
      } else {
        console.warn(`Product with ID ${id} not found.`);
      }
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error fetching product', err);
      this.isLoading = false;
    }
  });
}


  addToCart(): void {
    this.cartService.addToCart(this.product.id).subscribe({
      next: () => this.refreshCartCount(),
      error: (err) => console.error('Failed to add to cart', err)
    });
  }

  refreshCartCount(): void {
    this.cartService.getCart().subscribe(response => {
      const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
      this.cartState.updateCount(count);
    });
  }

  toggleFavorite(): void {
    this.auth.isLoggedIn$.subscribe((isLoggedIn) => {
      if (!isLoggedIn) {
        alert('يرجى تسجيل الدخول أولاً لإضافة المنتج إلى المفضلة');
        this.router.navigate(['/auth']);
        return;
      }
      this.product.isFavorite = !this.product.isFavorite;
    });
  }
}
