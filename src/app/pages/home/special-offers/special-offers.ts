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
    this.loadProductsAndFavorites();

    // 🟢 اسمع أي تغييرات من FavoriteService
    this.favoriteService.favorites$.subscribe(favs => {
      const favoriteIds = new Set(favs.map(f => f.id));
      this.products = this.products.map(p => ({
        ...p,
        isFavorite: favoriteIds.has(p.id)
      }));
    });


     // -------------------------
    // 1️⃣ Handle window resize
    // -------------------------
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);


    this.translate.use(this.languageService.getCurrentLanguage());

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.translate.use(lang);
    });

    this.currentLang = this.languageService.getCurrentLanguage();

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
     if (this.currentLang === 'ar') {
    // يبدأ من آخر سلايد (يمين)
    this.currentSlideIndex = this.products.length - this.visibleCards;
  } else {
    // يبدأ من أول سلايد (شمال)
    this.currentSlideIndex = 0;
  }


   this.cartState.cartItems$.subscribe(items => {
    this.cartItems = items;
  });

  this.cartState.cartCount$.subscribe(count => {
    // if you show a badge / counter
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
  if (this.clientService.isLoggedIn()) {   // ✅ use ClientService
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

    // ⭐ لو موبايل → يبدأ من النص
    if (this.isMobile && this.products.length > 0) {
      this.currentSlideIndex = Math.floor((this.products.length - 1) / 2);
    } else {
      this.currentSlideIndex = 0;
    }

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
  const storedCart = localStorage.getItem(this.GUEST_CART_KEY);
  const cart = storedCart ? JSON.parse(storedCart) : [];
  this.cartState.updateItems(cart); // ✅ sync
  return cart;
}




private saveGuestCart(cart: any[]): void {
  localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
  this.cartState.updateItems(cart); // ✅ sync with global state
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
        unit_price: safeNumber(product.price_before || product.price || product.original_price),
        sale_unit_price: safeNumber(product.price_after || product.price || product.sale_price),
        images: product.images || []
      });
    }

    this.saveGuestCart(cart);
    this.cartState.updateItems(cart); // 🟢 Sync UI
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
    if (item) {
      item.quantity++;
    }
    this.saveGuestCart(cart);
    this.cartState.updateItems(cart); // 🟢 Sync UI
    return;
  }

  this.cartService.addToCart(productId, 1).subscribe({
    next: () => this.loadCart()
  });
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
    this.cartState.updateItems(cart); // 🟢 Sync UI
    return;
  }

  this.cartService.reduceCartItem(productId).subscribe({
    next: () => this.loadCart()
  });
}

removeItem(productId: number): void {
  if (!this.isLoggedIn()) {
    const cart = this.loadGuestCart().filter(i => i.product_id !== productId);
    this.saveGuestCart(cart);
    this.cartState.updateItems(cart); // 🟢 Sync UI
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
      this.cartState.updateItems(items); // ✅
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
  return this.cartState.getCartSummary().items.find(i => i.product_id === productId);
}


  private handleHttpError(msg: string, err: HttpErrorResponse): void {
    console.error(msg, err);
    this.isLoading = false;
  }

private handleCartError(err: any): void {
  console.error('Error fetching cart', err);
  const guestCart = this.loadGuestCart();
  this.cartState.updateItems(guestCart); // ✅
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
    const isRTL = this.currentLang === 'ar';

    if ((swipeDistance > 0 && !isRTL) || (swipeDistance < 0 && isRTL)) {
      // سوايب يمين في LTR أو شمال في RTL → prev
      this.nextSlide();
    } else {
      // سوايب شمال في LTR أو يمين في RTL → next
      this.prevSlide();
    }
  }
}



// ---------------------- responsive ----------------------
  // updateVisibleCards() {
  //   if (window.innerWidth <= 768) this.visibleCards = 1;
  //   else if (window.innerWidth <= 1024) this.visibleCards = 2;
  //   else this.visibleCards = 3;
  // }


  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
    private resizeHandler = () => {
    this.updateVisibleCards();
    this.checkIfMobile();
  };
}


function safeNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, '')); // 🟢 يشيل الكوما
  }
  return Number(value);
}