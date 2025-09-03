import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {  ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';
import { FavoriteService } from '../../../services/favorite.service';

import { Downloadapp } from '../downloadapp/downloadapp';
import { ComparePopup } from '../../../compare-popup/compare-popup';
import { Product } from '../../../../models/Product';
import { Category } from '../../../../models/Category';

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

  cartItems: any[] = [];
  isLoading = true;

  currentSlideIndex = 0;
  visibleCards = 3;
  progressValue = 80;

  compareProducts: Product[] = [];
  showComparePopup = false;

  private resizeListener = this.updateVisibleCards.bind(this);
  private GUEST_CART_KEY = 'guest_cart';

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private cartService: CartService,
    public cartState: CartStateService,
    private router: Router,
    private route: ActivatedRoute,
    private favoriteService: FavoriteService
  ) { }

  ngOnInit(): void {
    this.updateVisibleCards();
    window.addEventListener('resize', this.resizeListener);

    const modeFromRoute = this.route.snapshot.data['mode'];
    if (modeFromRoute) this.mode = modeFromRoute;

    this.loadCartAndProducts();
    this.loadProductsAndFavorites();

    // 🟢 اسمع أي تغييرات من FavoriteService
    this.favoriteService.favorites$.subscribe(favs => {
      const favoriteIds = new Set(favs.map(f => f.id));
      this.products = this.products.map(p => ({
        ...p,
        isFavorite: favoriteIds.has(p.id)
      }));
    });
  }


  ngAfterViewInit() {
    this.myElement?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

  /** ------------------- CART + PRODUCTS ------------------- */
  private loadCartAndProducts(): void {
    if (!this.isLoggedIn()) {
      this.cartItems = this.loadGuestCart();
      this.refreshCartCount();
      this.loadProducts();
      return;
    }

    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems = response.data?.items || [];
        this.refreshCartCount();
        this.loadProducts();
      },
      error: (err) => this.handleCartError(err)
    });
  }

  private loadProducts(): void {
    this.productService.getOffer().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.products = [...products];
        this.extractCategories(products);
        this.isLoading = false;
      },
      error: (err) => this.handleHttpError('❌ Failed to load products:', err)
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

  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const token = localStorage.getItem('token');

    this.favoriteService.toggleFavorite(product, token).subscribe({
      next: (res) => {
        // ✅ لو عندك favorites$ في الـ service هيحدث تلقائي
        if (!this.favoriteService.favorites$) {
          // 🔄 Manual flip fallback
          product.isFavorite = !product.isFavorite;
        }
      },
      error: (err) => console.error('Error toggling favorite:', err)
    });
  }




  loadProductsAndFavorites(): void {
    this.productService.getOffer().subscribe(offerProducts => {
      this.allProducts = offerProducts;
      this.products = [...offerProducts];

      const token = localStorage.getItem('token');
      this.favoriteService.loadFavorites(token).subscribe(); // بس init
    });
  }


  /** ------------------- COMPARE ------------------- */
  addToCompare(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.compareProducts.find(p => p.id === product.id)) {
      alert('هذا المنتج مضاف بالفعل للمقارنة');
      return;
    }

    if (this.compareProducts.length >= 2) {
      alert('لا يمكنك إضافة أكثر من منتجين للمقارنة');
      return;
    }

    this.compareProducts.push(product);

    if (this.compareProducts.length === 1) {
      alert('تم إضافة المنتج الأول، من فضلك اختر منتج آخر للمقارنة');
    }

    if (this.compareProducts.length === 2) {
      this.showComparePopup = true;
    }
  }


  onCloseComparePopup(): void {
    this.showComparePopup = false;
    this.compareProducts = [];
  }

  /** ------------------- CART ACTIONS ------------------- */
  private loadGuestCart(): any[] {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  private saveGuestCart(cart: any[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
    this.cartItems = cart; // ⬅️ تحديث مباشر
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
          unit_price: product.price_before || product.price || product.original_price,
          sale_unit_price: product.price_after || product.price || product.sale_price,
          images: product.images
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

  increaseQuantity(productId: number): void {
    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart();
      const item = cart.find(i => i.product_id === productId);
      if (item) item.quantity++;
      this.saveGuestCart(cart);
      return;
    }
    this.cartService.addToCart(productId, 1).subscribe({ next: () => this.loadCart() });
  }

  decreaseQuantity(productId: number): void {
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
    this.cartService.reduceCartItem(productId).subscribe({ next: () => this.loadCart() });
  }

  removeItem(productId: number): void {
    if (!this.isLoggedIn()) {
      const cart = this.loadGuestCart().filter(i => i.product_id !== productId);
      this.saveGuestCart(cart);
      return;
    }
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
    const total = this.isLoggedIn()
      ? this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : this.loadGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

    this.cartState.updateCount(total);
  }

  /** ------------------- CAROUSEL ------------------- */
  updateVisibleCards(): void {
    if (window.innerWidth <= 768) this.visibleCards = 1;
    else if (window.innerWidth <= 1024) this.visibleCards = 2;
    else this.visibleCards = 4;
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

  /** ------------------- SWIPE ------------------- */
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
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) this.nextSlide();
      else this.prevSlide();
    }
  }
}
