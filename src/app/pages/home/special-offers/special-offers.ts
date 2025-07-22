import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Category, Product, ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './special-offers.html',
  styleUrls: ['./special-offers.scss'],
  providers: [ProductService]
})
export class SpecialOffersComponent implements OnInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';
  products: Product[] = [];

  categories: Category[] = [];

  isLoading = true;
  currentSlideIndex = 0;
  visibleCards = 3;

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private router: Router,
    private cartService: CartService,
    public cartState: CartStateService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    const modeFromRoute = this.route.snapshot.data['mode'];
    if (modeFromRoute) this.mode = modeFromRoute;
    this.loadProducts();
  }

 private loadProducts(): void {
  this.isLoading = true;
  this.productService.getOffer().subscribe({
    next: (products) => {
      this.products = products;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Failed to load products:', err);
      this.isLoading = false;
    }
  });
}


  nextSlide(): void {
    if (this.currentSlideIndex < this.products.length - this.visibleCards) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  addToCart(productId: number): void {
    this.cartService.addToCart(productId).subscribe({
      next: () => this.refreshCartCount(),
      error: (err) => console.error('Failed to add to cart', err)
    });
  }

  private refreshCartCount(): void {
    this.cartService.getCart().subscribe(response => {
      this.cartState.updateCount(response.data.items.reduce((total, item) => total + item.quantity, 0));
    });
  }

  toggleFavorite(product: Product): void {
    if (!this.auth.isLoggedIn$) {
      alert('يرجى تسجيل الدخول أولاً لإضافة المنتج إلى المفضلة');
      this.router.navigate(['/auth']);
      return;
    }
    product.isFavorite = !product.isFavorite;
  }

  addToCompare(product: Product): void {
    console.log('Compare:', product);
  }


  filteredProducts: Product[] = [];
  private fetchProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.categories = this.extractUniqueCategories(products);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }

  private extractUniqueCategories(products: Product[]): Category[] {
    const map = new Map<number, Category>();
    products.forEach(product => {
      product.categories?.forEach(category => {
        if (!map.has(category.id)) {
          map.set(category.id, category);
        }
      });
    });
    return Array.from(map.values());
  }

  getTotalSlides(): number {
    return Math.ceil(this.filteredProducts.length / this.visibleCards);
  }
  getDotsArray(): number[] {
    const slideCount = Math.ceil(this.products.length / this.visibleCards);
    return Array.from({ length: slideCount }, (_, i) => i);
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }
}