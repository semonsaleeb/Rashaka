import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { FavoriteService } from '../../../services/favorite.service';

import { Downloadapp } from '../downloadapp/downloadapp';
import { ComparePopup } from '../../../compare-popup/compare-popup';
import { Product } from '../../../../models/Product';
import { Category } from '../../../../models/Category';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { TruncatePipe } from '../../../truncate-pipe';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule, TruncatePipe, RouterModule, FormsModule, Downloadapp, ComparePopup, TranslateModule],
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

  cartItems: any[] = [];
  isLoading = true;

  currentSlideIndex = 0;
  visibleCards = 3;
  progressValue = 80;
  
  currentLang: string = 'ar';

  compareProducts: Product[] = [];
  showComparePopup = false;

  isMobile = false;

  private resizeListener = this.updateVisibleCards.bind(this);
  private GUEST_CART_KEY = 'guest_cart';

  // Touch events for swipe
  touchStartX = 0;
  touchEndX = 0;

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private cartService: CartService,
    public cartState: CartStateService,
    private router: Router,
    private route: ActivatedRoute,
    private favoriteService: FavoriteService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private clientService: ClientService,
  ) { }

  ngOnInit(): void {
    this.updateVisibleCards();
    window.addEventListener('resize', this.resizeListener);

    const modeFromRoute = this.route.snapshot.data['mode'];
    if (modeFromRoute) this.mode = modeFromRoute;

    this.loadCartAndProducts();

    // Listen to favorite changes
    this.favoriteService.favorites$.subscribe(favs => {
      const favoriteIds = new Set(favs.map(f => f.id));
      this.products = this.products.map(p => ({
        ...p,
        isFavorite: favoriteIds.has(p.id)
      }));
      this.allProducts = this.allProducts.map(p => ({
        ...p,
        isFavorite: favoriteIds.has(p.id)
      }));
    });

    // Handle window resize
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);

    // Language setup
    this.currentLang = this.languageService.getCurrentLanguage();
    this.translate.use(this.currentLang);

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
      this.setInitialSlidePosition();
    });

    // Cart state subscriptions
    this.cartState.cartItems$.subscribe(items => {
      this.cartItems = items;
    });

    this.cartState.cartCount$.subscribe(count => {
      // Handle cart count changes if needed
    });
  }

  ngAfterViewInit() {
    this.myElement?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
    window.removeEventListener('resize', this.resizeHandler);
  }

  /** ------------------- CAROUSEL CONTROLS ------------------- */
getTransformValue(): string {
  const slideWidth = 100 / this.visibleCards;
  const translateX = this.currentSlideIndex * slideWidth;
  
  if (this.currentLang === 'ar') {
    return `${translateX}%`;
  } else {
    return `-${translateX}%`;
  }
}

private updateVisibleCards(): void {
  const width = window.innerWidth;
  
  if (width <= 768) {
    this.visibleCards = 1;
    this.isMobile = true;
  } else if (width <= 1024) {
    this.visibleCards = 2;
    this.isMobile = false;
  } else {
    this.visibleCards = 3; // تأكد إن ده 4 مش 3
    this.isMobile = false;
  }
  
  this.currentSlideIndex = 0;
}

  getDotsArray(): number[] {
    const totalSlides = Math.ceil(this.products.length / this.visibleCards);
    return Array.from({ length: totalSlides }, (_, i) => i);
  }

  goToSlide(index: number): void {
    const maxIndex = Math.max(0, this.getDotsArray().length - 1);
    this.currentSlideIndex = Math.min(Math.max(0, index), maxIndex);
  }

  nextSlide(): void {
    const maxIndex = Math.max(0, this.getDotsArray().length - 1);
    
    if (this.currentLang === 'ar') {
      // RTL: moving to next means going to previous index
      if (this.currentSlideIndex > 0) {
        this.currentSlideIndex--;
      }
    } else {
      // LTR: moving to next means going to next index
      if (this.currentSlideIndex < maxIndex) {
        this.currentSlideIndex++;
      }
    }
  }

  prevSlide(): void {
    const maxIndex = Math.max(0, this.getDotsArray().length - 1);
    
    if (this.currentLang === 'ar') {
      // RTL: moving to previous means going to next index
      if (this.currentSlideIndex < maxIndex) {
        this.currentSlideIndex++;
      }
    } else {
      // LTR: moving to previous means going to previous index
      if (this.currentSlideIndex > 0) {
        this.currentSlideIndex--;
      }
    }
  }

  isNextDisabled(): boolean {
    const maxIndex = Math.max(0, this.getDotsArray().length - 1);
    
    if (this.currentLang === 'ar') {
      return this.currentSlideIndex <= 0;
    } else {
      return this.currentSlideIndex >= maxIndex;
    }
  }

  isPrevDisabled(): boolean {
    const maxIndex = Math.max(0, this.getDotsArray().length - 1);
    
    if (this.currentLang === 'ar') {
      return this.currentSlideIndex >= maxIndex;
    } else {
      return this.currentSlideIndex <= 0;
    }
  }

  private setInitialSlidePosition(): void {
    const maxIndex = Math.max(0, this.getDotsArray().length - 1);
    this.currentSlideIndex = this.currentLang === 'ar' ? maxIndex : 0;
  }

  /** ------------------- TOUCH/SWIPE HANDLING ------------------- */

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe right → previous slide
        this.prevSlide();
      } else {
        // Swipe left → next slide
        this.nextSlide();
      }
    }
  }

  /** ------------------- RESPONSIVE HANDLING ------------------- */

  // private updateVisibleCards(): void {
  //   const width = window.innerWidth;
    
  //   if (width <= 768) {
  //     this.visibleCards = 1;
  //     this.isMobile = true;
  //   } else if (width <= 1024) {
  //     this.visibleCards = 2;
  //     this.isMobile = false;
  //   } else {
  //     this.visibleCards = 4;
  //     this.isMobile = false;
  //   }

  //   // Reset slide position after resize
  //   this.setInitialSlidePosition();
  // }

  private resizeHandler = (): void => {
    this.updateVisibleCards();
  };

  /** ------------------- PRODUCTS & CART ------------------- */

  private loadCartAndProducts(): void {
    if (this.clientService.isLoggedIn()) {
      this.cartService.getCart().subscribe({
        next: (response) => {
          const items = response.data?.items || [];
          this.cartState.updateItems(items);
          this.loadProducts();
          this.refreshCartCount();
        },
        error: (err) => {
          console.error('Error fetching cart', err);
          this.loadProducts();
        }
      });
    } else {
      const guestCart = this.loadGuestCart();
      this.cartState.updateItems(guestCart);
      this.loadProducts();
    }
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.productService.getOffer().subscribe({
      next: (products) => {
        console.log('Offer products:', products);
        this.allProducts = products;
        this.products = [...products];
        this.extractCategories(products);
        this.setInitialSlidePosition();
        this.loadFavorites();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }

  private loadFavorites(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.favoriteService.loadFavorites(token).subscribe({
        next: (favorites) => {
          const favoriteIds = new Set(favorites.map(f => f.id));
          this.products = this.products.map(p => ({
            ...p,
            isFavorite: favoriteIds.has(p.id)
          }));
          this.allProducts = this.allProducts.map(p => ({
            ...p,
            isFavorite: favoriteIds.has(p.id)
          }));
        },
        error: (err) => console.error('Error loading favorites:', err)
      });
    }
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
    this.setInitialSlidePosition();
  }

  /** ------------------- FAVORITES ------------------- */

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const token = localStorage.getItem('token');

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: (res) => {
        // Favorites will update via the favorites$ subscription
      },
      error: (err) => console.error('Error toggling favorite:', err)
    });
  }

  /** ------------------- COMPARE ------------------- */

  addToCompare(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.compareProducts.find(p => p.id === product.id)) {
      alert(this.translate.instant('PRODUCT_ALREADY_IN_COMPARE'));
      return;
    }

    if (this.compareProducts.length >= 2) {
      alert(this.translate.instant('MAX_COMPARE_PRODUCTS'));
      return;
    }

    this.compareProducts.push(product);

    if (this.compareProducts.length === 1) {
      alert(this.translate.instant('FIRST_PRODUCT_ADDED'));
    }

    if (this.compareProducts.length === 2) {
      this.showComparePopup = true;
    }
  }

  isInCompare(product: Product): boolean {
    return this.compareProducts.some(p => p.id === product.id);
  }

  onCloseComparePopup(): void {
    this.showComparePopup = false;
    this.compareProducts = [];
  }

  /** ------------------- CART ACTIONS ------------------- */

  private loadGuestCart(): any[] {
    const storedCart = localStorage.getItem(this.GUEST_CART_KEY);
    const cart = storedCart ? JSON.parse(storedCart) : [];
    this.cartState.updateItems(cart);
    return cart;
  }

  private saveGuestCart(cart: any[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    this.cartState.updateItems(cart);
    this.refreshCartCount();
  }

  addToCart(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const existing = cart.find(i => i.product_id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          product_id: product.id,
          quantity: 1,
          product_name_ar: product.name_ar,
          product_name: product.name,
          unit_price: safeNumber(product.price_before || product.price || product.original_price),
          sale_unit_price: safeNumber(product.price_after || product.price || product.sale_price),
          images: product.images || []
        });
      }

      this.saveGuestCart(cart);
      return;
    }

    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => this.loadCart(),
      error: (err) => this.handleCartActionError(err)
    });
  }

  increaseQuantity(productId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) {
        item.quantity++;
      }
      this.saveGuestCart(cart);
      return;
    }

    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.loadCart()
    });
  }

  decreaseQuantity(productId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.isLoggedIn()) {
      let cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) {
        item.quantity--;
        if (item.quantity <= 0) {
          cart = cart.filter(i => i.product_id !== productId);
        }
      }
      this.saveGuestCart(cart);
      return;
    }

    this.cartService.reduceCartItem(productId).subscribe({
      next: () => this.loadCart()
    });
  }

  removeItem(productId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart().filter(i => i.product_id !== productId);
      this.saveGuestCart(cart);
      return;
    }

    this.cartService.removeCartItem(productId).subscribe({
      next: () => this.loadCart()
    });
  }

  private loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        const items = response.data?.items || [];
        this.cartState.updateItems(items);
        this.refreshCartCount();
      },
      error: (err) => this.handleCartError(err)
    });
  }

  private refreshCartCount(): void {
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

    this.cartState.updateCount(total);
  }

  isInCart(productId: number): boolean {
    return this.cartItems.some(item => item.product_id === productId);
  }

  getCartItem(productId: number) {
    return this.cartState.getCartSummary().items.find(i => i.product_id === productId);
  }

  /** ------------------- ERROR HANDLING ------------------- */

  private handleHttpError(msg: string, err: HttpErrorResponse): void {
    console.error(msg, err);
    this.isLoading = false;
  }

  private handleCartError(err: any): void {
    console.error('Error fetching cart', err);
    const guestCart = this.loadGuestCart();
    this.cartState.updateItems(guestCart);
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
  
}

function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}