import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product, ProductService } from '../services/product';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../services/favorite.service';
import { map, Observable } from 'rxjs';
import { Downloadapp } from '../pages/home/downloadapp/downloadapp';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Downloadapp
  ],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCard implements OnInit {
  product!: Product;
  isLoading = true;
  errorMessage = '';
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  Math = Math;
showFullDescription = false;
wordLimit = 20;
  showDescription = true; showReviews = false;
  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private auth: AuthService,
    private cartService: CartService,
    public cartState: CartStateService,
    private favoriteService: FavoriteService
  ) { }

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!productId || isNaN(productId)) {
      this.errorMessage = 'Invalid product ID';
      this.isLoading = false;
      return;
    }

    const token = localStorage.getItem('token') || '';

    this.productService.getProductById(productId, token).subscribe({
      next: (product) => {
        this.product = {
          ...product,
          average_rating: product.average_rating ?? 0,
          isFavorite: false // مؤقتاً لحد ما نشوف من favoriteService
        };

        // 🟢 هنا نسمع أي تغيير في الـ favorites$ و نحدث حالة المنتج
        this.favoriteService.favorites$.subscribe(favs => {
          this.product.isFavorite = favs.some(fav => fav.id === this.product.id);
        });

        console.log('Loaded product:', this.product);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching product details', err);
        this.errorMessage = 'Failed to load product details';
        this.isLoading = false;
      }
    });
  }



  getProductById(id: number, token: string): Observable<Product> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    });

    const url = `${environment.apiBaseUrl}/products?product_id=${id}`;

    return this.http.get<{ status: string; data: Product[] }>(url, { headers }).pipe(
      map(response => {
        const found = response.data.find(p => p.id === id);
        if (!found) throw new Error(`Product with ID ${id} not found`);
        return found;
      })
    );
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
get shortDescription(): string {
  const desc = this.product?.description_ar || this.product?.description || '';
  const words = desc.split(' ');
  return words.slice(0, this.wordLimit).join(' ');
}

get hasMore(): boolean {
  const desc = this.product?.description_ar || this.product?.description  || '';
  return desc.split(' ').length > this.wordLimit;
}
  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const token = localStorage.getItem('token');

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: () => {
        // مفيش داعي لأي حاجة هنا
        // الـ favorites$ هيتحدث تلقائي
      },
      error: (err) => console.error('Error toggling favorite:', err)
    });
  }




  getFullStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getHalfStar(rating: number): boolean {
    return rating % 1 !== 0;
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.ceil(rating)).fill(0);
  }
}
