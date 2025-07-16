import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Product, ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './special-offers.html',
  styleUrls: ['./special-offers.scss'],
  providers: [ProductService]
})
export class SpecialOffersComponent implements OnInit {
  products: Product[] = [];
  groupedProducts: Product[][] = [];
  isLoading = true;

  currentSlideIndex = 0;


constructor(
  private productService: ProductService,
  private auth: AuthService,
  private router: Router,
  private cartService: CartService,
   public cartState: CartStateService
) {}
  ngOnInit(): void {
    
        this.fetchProducts();
    // throw new Error('Method not implemented.');
  }

 addToCart(productId: number): void {
    this.cartService.addToCart(productId).subscribe({
      next: (res) => {
        console.log('Product added successfully', res);
        this.refreshCartCount();
        // Optionally refresh cart icon count (via shared service or manual reload)
      },
      error: (err) => {
        console.error('Failed to add to cart', err);
      }
    });
  }
refreshCartCount() {
  this.cartService.getCart().subscribe(response => {
    const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
    this.cartState.updateCount(count); // ✅ This triggers header update
  });
}

toggleFavorite(product: Product) {
  if (!this.auth.isLoggedIn$) {
    // User is not logged in
    alert('يرجى تسجيل الدخول أولاً لإضافة المنتج إلى المفضلة');
    this.router.navigate(['/auth']); // Navigate to login page
    return;
  }

  product.isFavorite = !product.isFavorite;
}


  private fetchProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.groupedProducts = this.chunkProducts(products, 3); // 3 cards per slide
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }

  private chunkProducts(arr: Product[], size: number): Product[][] {
    const result: Product[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

 

  addToCompare(product: Product) {
    console.log('Compare:', product);
  }

  prevSlide() {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.groupedProducts.length) % this.groupedProducts.length;
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.groupedProducts.length;
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
  }
}
