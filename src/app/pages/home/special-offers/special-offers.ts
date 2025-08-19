import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Category, Product, ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { FavoriteService } from '../../../services/favorite.service';

import { Downloadapp } from '../downloadapp/downloadapp';
import { Blogs } from '../blogs/blogs';
import { ComparePopup } from '../../../compare-popup/compare-popup';

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Downloadapp, ComparePopup],
  templateUrl: './special-offers.html',
  styleUrls: ['./special-offers.scss'],
  providers: [ProductService]
})
export class SpecialOffersComponent implements OnInit, OnDestroy {
  @Input() mode: 'carousel' | 'grid' | 'mobile' = 'grid';
  @ViewChild('allBtn') allBtn!: ElementRef;
  @ViewChild('myElement') myElement!: ElementRef;

  allProducts: Product[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategory: number | 'all' = 'all';
  progressValue = 80;

  cartItems: any[] = [];
  isLoading = true;

  currentSlideIndex = 0;
  visibleCards = 3;

  compareProducts: Product[] = [];
  showComparePopup = false;

  resizeListener = this.updateVisibleCards.bind(this);

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private cartService: CartService,
    public cartState: CartStateService,
    private router: Router,
    private route: ActivatedRoute,
    private favoriteService: FavoriteService
  ) {}

  ngOnInit(): void {
    this.updateVisibleCards();
    window.addEventListener('resize', this.resizeListener);

    const modeFromRoute = this.route.snapshot.data['mode'];
    if (modeFromRoute) this.mode = modeFromRoute;

    this.loadCartAndProducts();
    this.loadProductsAndFavorites();
  }

  ngAfterViewInit() {
    this.myElement?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

  /** ------------------- CART + PRODUCTS ------------------- */
  private loadCartAndProducts(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data?.items || [];
        this.refreshCartCount();

        this.productService.getOffer().subscribe({
          next: (products) => {
            this.allProducts = products;
            this.products = [...products];
            this.extractCategories(products);
            this.isLoading = false;
          },
          error: (err) => this.handleHttpError('❌ Failed to load products:', err)
        });
      },
      error: (err) => this.handleCartError(err)
    });
  }

  private extractCategories(products: Product[]): void {
    const uniqueCategories = new Map<number, Category>();
    products.forEach(product =>
      product.categories.forEach(cat => {
        if (!uniqueCategories.has(cat.id)) uniqueCategories.set(cat.id, cat);
      })
    );
    this.categories = Array.from(uniqueCategories.values());
  }

  filterByCategory(categoryId: number | 'all'): void {
    this.products = categoryId === 'all'
      ? [...this.allProducts]
      : this.allProducts.filter(p => p.categories.some(c => c.id === categoryId));

    this.selectedCategory = categoryId;
    this.currentSlideIndex = 0;
  }

  /** ------------------- AUTH + FAVORITES ------------------- */
  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  toggleFavorite(product: Product): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: () => {
        product.isFavorite = !product.isFavorite;
        const favorites = this.favoriteService.getFavorites();

        this.favoriteService.setFavorites(
          product.isFavorite
            ? [...favorites, product]
            : favorites.filter(p => p.id !== product.id)
        );
      },
      error: (err) => console.error('Error updating favorite:', err)
    });
  }

  loadProductsAndFavorites(): void {
    this.productService.getOffer().subscribe(offerProducts => {
      const token = localStorage.getItem('token');

      if (token) {
        this.favoriteService.loadFavorites(token).subscribe(favorites => {
          const favoriteIds = new Set(favorites.map(f => f.id));

          this.products = offerProducts.map(p => ({
            ...p,
            isFavorite: favoriteIds.has(p.id)
          }));

          this.favoriteService.setFavorites(
            offerProducts.filter(p => favoriteIds.has(p.id))
          );
        });
      } else {
        this.products = offerProducts.map(p => ({ ...p, isFavorite: false }));
      }
    });
  }

  /** ------------------- COMPARE ------------------- */
  addToCompare(product: Product): void {
    if (this.compareProducts.find(p => p.id === product.id)) return;
    if (this.compareProducts.length >= 2) return;

    this.compareProducts.push(product);

    if (this.compareProducts.length === 2) {
      this.showComparePopup = true;
    }
  }

  onCloseComparePopup(): void {
    this.showComparePopup = false;
    this.compareProducts = [];
  }

  /** ------------------- CART ACTIONS ------------------- */
  addToCart(productId: number): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart(),
      error: (err) => this.handleCartActionError(err)
    });
  }

  increaseQuantity(productId: number) {
    this.cartService.addToCart(productId, 1).subscribe({ next: () => this.loadCart() });
  }

  decreaseQuantity(productId: number) {
    this.cartService.reduceCartItem(productId).subscribe({ next: () => this.loadCart() });
  }

  removeItem(productId: number) {
    this.cartService.removeCartItem(productId).subscribe({ next: () => this.loadCart() });
  }

  private loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data?.items || [];
        this.refreshCartCount();
      },
      error: (err) => this.handleCartError(err)
    });
  }

  private refreshCartCount(): void {
    const total = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.cartState.updateCount(total);
  }

  /** ------------------- CAROUSEL ------------------- */
  updateVisibleCards(): void {
    if (window.innerWidth <= 768) this.visibleCards = 1;       // mobile
    else if (window.innerWidth <= 1024) this.visibleCards = 2; // tablet
    else this.visibleCards = 4;                                // desktop
  }

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

  /** ------------------- HELPERS ------------------- */
  isInCart(productId: number): boolean {
    return this.cartItems.some(item => item.product_id === productId);
  }

  getCartItem(productId: number) {
    return this.cartItems.find(item => item.product_id === productId);
  }

  private handleHttpError(msg: string, err: HttpErrorResponse): void {
    console.error(msg, err);
    this.isLoading = false;
  }

  private handleCartError(err: HttpErrorResponse): void {
    console.error('❌ Error loading cart:', err);
    if (err.status === 401) this.auth.logout();
    this.resetCartState();
    this.isLoading = false;
  }

  private handleCartActionError(err: HttpErrorResponse): void {
    console.error('❌ Cart action failed:', err);
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


  


  touchStartX = 0;
touchEndX = 0;

onTouchStart(event: TouchEvent): void {
  this.touchStartX = event.changedTouches[0].screenX;
}

onTouchEnd(event: TouchEvent): void {
  this.touchEndX = event.changedTouches[0].screenX;
  this.handleSwipe();
}

handleSwipe(): void {
  const swipeDistance = this.touchEndX - this.touchStartX;

  if (Math.abs(swipeDistance) > 50) { // عتبة عشان ما يعتبرش اللمسة العادية Swipe
    if (swipeDistance > 0) {
      // 👉 Swipe يمين → روح للسابق
      this.nextSlide();
    } else {
      // 👈 Swipe شمال → روح للي بعده
      this.prevSlide();
    }
  }
}
}
