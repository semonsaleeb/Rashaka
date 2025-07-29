import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Category, Product, ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { FormsModule } from '@angular/forms';
import { Downloadapp } from '../downloadapp/downloadapp';
import { Blogs } from '../blogs/blogs';
import { FavoriteService } from '../../../services/favorite.service';

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule, Downloadapp, Blogs],
  templateUrl: './special-offers.html',
  styleUrls: ['./special-offers.scss'],
  providers: [ProductService]
})
export class SpecialOffersComponent implements OnInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';
  allProducts: Product[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategory: number | 'all' = 'all';
  @ViewChild('allBtn') allBtn!: ElementRef;

  cartItems: any[] = [];
  isLoading = true;
  currentSlideIndex = 0;
  visibleCards = 3;

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    public router: Router,
    private cartService: CartService,
    public cartState: CartStateService,
    private route: ActivatedRoute,
    private favoriteService: FavoriteService,


  ) { }

  ngOnInit(): void {
    const modeFromRoute = this.route.snapshot.data['mode'];
    if (modeFromRoute) this.mode = modeFromRoute;

    this.loadCartAndProducts();
    this.loadProductsAndFavorites();

  }
  @ViewChild('myElement') myElement!: ElementRef;

  ngAfterViewInit() {
    if (this.myElement?.nativeElement) {
      this.myElement.nativeElement.scrollIntoView();
    }
  }

  private loadCartAndProducts(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data?.items || [];

        this.productService.getOffer().subscribe({
          next: (products) => {
            this.allProducts = products;
            this.products = [...products];
            this.extractCategories(products);
            this.isLoading = false;
          },
          error: (err: HttpErrorResponse) => {
            console.error('❌ Failed to load products:', err);
            this.isLoading = false;
          }
        });

        // Update cart count
        const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        this.cartState.updateCount(total);
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error loading cart:', err);
        this.resetCartState();
        this.isLoading = false;
      }
    });
  }


  private extractCategories(products: Product[]): void {
    const map = new Map<number, Category>();
    products.forEach(product => {
      product.categories.forEach(cat => {
        if (!map.has(cat.id)) {
          map.set(cat.id, cat);
        }
      });
    });
    this.categories = Array.from(map.values());
  }

  filterByCategory(categoryId: number | 'all'): void {
    if (categoryId === 'all') {
      this.products = [...this.allProducts];
      this.selectedCategory = 'all';
    } else {
      this.products = this.allProducts.filter(product =>
        product.categories.some(c => c.id === categoryId)
      );
      this.selectedCategory = categoryId;
    }
    this.currentSlideIndex = 0;
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

  private handleCartResponse(response: any): void {
    this.cartItems = response.data?.items || [];
    const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(total);
  }

  private handleCartError(err: HttpErrorResponse): void {
    console.error('❌ Error loading cart:', err);
    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    } else {
      this.resetCartState();
    }
  }

  private resetCartState(): void {
    this.cartItems = [];
    this.cartState.updateCount(0);
  }

  private handleCartActionError(err: HttpErrorResponse): void {
    console.error('❌ Cart action failed:', err);
    if (err.status === 401) {
      this.auth.logout();
      this.resetCartState();
      this.router.navigate(['/auth/login']);
    }
  }

  toggleFavorite(product: Product): void {
    if (!this.isLoggedIn) {
      alert('يرجى تسجيل الدخول أولاً لإضافة المنتج إلى المفضلة');
      this.router.navigate(['/auth/login']);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: () => {
        product.isFavorite = !product.isFavorite;

        const currentFavorites = this.favoriteService.getFavorites();
        if (product.isFavorite) {
          this.favoriteService.setFavorites([...currentFavorites, product]);
        } else {
          const updated = currentFavorites.filter(p => p.id !== product.id);
          this.favoriteService.setFavorites(updated);
        }
      },
      error: err => {
        console.error('Error updating favorite:', err);
      }
    });
  }

  loadProductsAndFavorites(): void {
  const token = localStorage.getItem('token');
  if (!token) return;

  this.productService.getOffer().subscribe(offerProducts => {
    this.favoriteService.loadFavorites(token).subscribe(favorites => {
      const favoriteIds = new Set(favorites.map(fav => fav.id));

      // Tag only offer products that are in favorites
      this.products = offerProducts.map(product => ({
        ...product,
        isFavorite: favoriteIds.has(product.id)
      }));

      // Update global favorite state with ONLY offers that are favorited
      const filteredFavorites = offerProducts.filter(p => favoriteIds.has(p.id));
      this.favoriteService.setFavorites(filteredFavorites);
    });
  });
}



  addToCompare(product: Product): void {
    console.log('Compare:', product);
  }

  // Carousel
  getDotsArray(): number[] {
    const slideCount = Math.ceil(this.products.length / this.visibleCards);
    return Array.from({ length: slideCount }, (_, i) => i);
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
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

  isInCart(productId: number): boolean {
    return this.cartItems.some(item => item.product_id === productId);
  }

  getCartItem(productId: number) {
    return this.cartItems.find(item => item.product_id === productId);
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

}
