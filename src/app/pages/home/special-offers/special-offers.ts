import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Product, ProductService, Category } from '../../../services/product';
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
  filteredProducts: Product[] = [];
  groupedProducts: Product[][] = [];
  categories: Category[] = [];
  selectedCategory: number | 'all' = 'all';

  isLoading = true;
  currentSlideIndex = 0;

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private router: Router,
    private cartService: CartService,
    public cartState: CartStateService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const modeFromRoute = this.route.snapshot.data['mode'];
    if (modeFromRoute) this.mode = modeFromRoute;

    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.isLoading = true;

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.groupedProducts = this.chunkProducts(products, 3);
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

  filterByCategory(categoryId: number | 'all'): void {
    this.selectedCategory = categoryId;
    this.currentSlideIndex = 0;

    if (categoryId === 'all') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(product =>
        product.categories?.some(c => c.id === categoryId)
      );
    }

    this.groupedProducts = this.chunkProducts(this.filteredProducts, 3);
  }

  private chunkProducts(arr: Product[], size: number): Product[][] {
    const result: Product[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  addToCart(productId: number): void {
    this.cartService.addToCart(productId).subscribe({
      next: (res) => {
        console.log('Product added successfully', res);
        this.refreshCartCount();
      },
      error: (err) => {
        console.error('Failed to add to cart', err);
      }
    });
  }

  refreshCartCount(): void {
    this.cartService.getCart().subscribe(response => {
      const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
      this.cartState.updateCount(count);
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

  prevSlide(): void {
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.groupedProducts.length) % this.groupedProducts.length;
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.groupedProducts.length;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }
}
