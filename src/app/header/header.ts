// header.ts
import { Component, OnInit, ElementRef, HostListener, inject } from '@angular/core';

import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service'; // ✅ Add this
import { FavoriteService } from '../services/favorite.service';
import { CartStateService } from '../services/cart-state-service';
import { CartIconComponent } from '../cart-icon.component/cart-icon.component';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {  ProductService } from '../services/product';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/Category';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [

    NgbDropdownModule, RouterModule, CommonModule, FormsModule, RouterLink

  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit {
  selectedLanguage = 'العربية';
  searchQuery = '';
  isLoggedIn = false;
  client: any = null;
  favoriteCount: number = 0;
  cartCount = 0;
  categories: Category[] = [];
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  allProducts: any[] = [];       // جميع المنتجات
  selectedCategory: number | 'all' = 'all';
  currentSlideIndex: number = 0;

  // inside your class
  private route = inject(ActivatedRoute);

  navItems = [
    { label: 'الرئيسية', path: '/', active: false },
    { label: 'المتجر', path: '/home/category-products', hasDropdown: true, showDropdown: true },
    { label: 'الاشتراكات', path: '/home/packages', hasDropdown: false },
    { label: 'قصص نجاح عملائنا', path: '/home/sucesStory', hasDropdown: false },
    { label: 'الفحوصات المجانيه', path: '/reservation', hasDropdown: false },
    { label: 'العروض', path: '/home/special-offers', hasDropdown: false },
    { label: 'المدونة ', path: '/home/blogs', hasDropdown: false },
    { label: 'عن رشاقة ', path: '/about_us', hasDropdown: false },


  ];

  toggleDropdown(item: any) {
    this.navItems.forEach(i => {
      if (i !== item && i.hasDropdown) {
        i.showDropdown = false;
      }
    });
    item.showDropdown = !item.showDropdown;
  }



  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private productService: ProductService,
    private favoriteService: FavoriteService,
    private cartService: CartService,
    private cartState: CartStateService,
  ) { }


  ngOnInit(): void {
    // -------------------------
    // 1️⃣ Update Cart Count
    // -------------------------
    this.updateCartCount(); // initial cart count

    this.cartState.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    // -------------------------
    // 2️⃣ Subscribe to Favorite Count
    // -------------------------
    this.favoriteService.favoriteCount$.subscribe(count => {
      this.favoriteCount = count;
    });

    // -------------------------
    // 3️⃣ Handle Authentication & Favorites
    // -------------------------
    this.auth.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      const clientData = localStorage.getItem('client');
      this.client = (status && clientData) ? JSON.parse(clientData) : null;

      if (status) {
        const token = localStorage.getItem('token');
        if (token) {
          this.favoriteService.loadFavorites(token).subscribe({
            next: (favorites) => {
              this.favoriteService.setFavorites(favorites);
            },
            error: (err) => {
              console.error('Failed to load favorites:', err);
            }
          });
        }
      } else {
        const localFavs = this.favoriteService.getLocalFavorites();
        this.favoriteService.setFavorites(localFavs);
      }
    });

    // -------------------------
    // 4️⃣ Load Categories
    // -------------------------
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.categories = this.extractUniqueCategories(products);
      },
      error: (err) => {
        console.error('Failed to fetch products:', err);
      }
    });

    // -------------------------
    // 5️⃣ Initialize Dropdown
    // -------------------------
    const defaultNavItem = this.navItems.find(i => i.hasDropdown);
    if (defaultNavItem) {
      this.toggleDropdown(defaultNavItem);
    }

    // -------------------------
    // 6️⃣ Load Products by URL query (category filter)
    // -------------------------
    this.route.queryParams.subscribe(params => {
      const categoryId = params['category_id'];
      if (categoryId && categoryId !== 'all') {
        this.loadProductsByCategory(+categoryId);
      } else if (categoryId === 'all') {
        this.loadAllProducts();
      }
    });
  }

  // -------------------------
  // Helper methods
  // -------------------------
  loadProductsByCategory(categoryId: number): void {
    this.productService.getProductsByCategory(categoryId).subscribe({
      next: (products) => {
        this.allProducts = products;
      },
      error: (err) => console.error('Failed to load products for category', err)
    });
  }

  loadAllProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
      },
      error: (err) => console.error('Failed to load all products', err)
    });
  }



  extractUniqueCategories(products: any[]): Category[] {
    const categoryMap = new Map<number, Category>();
    products.forEach(product => {
      if (product.categories) {
        product.categories.forEach((category: Category) => {
          if (category && category.id && !categoryMap.has(category.id)) {
            categoryMap.set(category.id, category);
          }
        });
      }
    });
    return Array.from(categoryMap.values());
  }

  updateCartCount(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartCount = response.data.totalQuantity;
      },
      error: (err: HttpErrorResponse) => {
        const apiMessage = err?.error?.message;
        if (err.status === 401 || apiMessage === 'Unauthenticated.') {
          this.cartCount = 0; // reset
        } else {
          console.error('Error fetching cart count:', err);
        }
      }
    });

  }



  products: any[] = [];
  filteredProducts: any[] = [];


  onSearch() {
    const trimmedQuery = this.searchQuery.trim();

    if (trimmedQuery.length === 0) {
      this.products = [];
      return;
    }

    this.http.get<any>(`${environment.apiBaseUrl}/product/search?q=${encodeURIComponent(trimmedQuery)}`)
      .subscribe({
        next: response => {
          this.products = response?.data || [];
        },
        error: err => {
          console.error('Search error:', err);
          this.products = [];
        }
      });
  }


  onWhatsAppClick() {
    window.open('https://wa.me/+966123456789', '_blank');
  }



  onNavItemClick(item: any) {
    this.navItems.forEach(navItem => navItem.active = false);
    item.active = true;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('client');
        this.router.navigate(['/auth']).then(() => {
          window.location.reload(); // ✅ Full page refresh after navigating
        });
      },
      error: (err) => {
        console.error('Logout failed', err);
        localStorage.removeItem('token');
        localStorage.removeItem('client');
        this.router.navigate(['/auth']).then(() => {
          window.location.reload(); // ✅ Also refresh on error fallback
        });
      }
    });
  }
onGetStarted() {
  this.router.navigate(['/reservation']);
}



  isStoreOpen: boolean = false;

  isMobileMenuOpen: boolean = false;


  isMenuOpen = false;
  // isStoreOpen = false;

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }


  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.isMenuOpen = false;
    document.body.classList.remove('menu-open');
  }
  closeAllDropdowns() {
    this.navItems.forEach(i => i.showDropdown = false);
    this.isStoreOpen = false; // also close the store dropdown if open
  }

  onNavClick(event: MouseEvent, item: any): void {
    if (item.hasDropdown) {
      event.preventDefault(); // stop default link behavior
      event.stopPropagation(); // stop bubbling
      this.toggleDropdown(item);
    } else {
      this.closeAllDropdowns();
    }
  }

  handleNavClick(item: any): void {
    if (item.hasDropdown) {
      this.toggleDropdown(item);
    }
    this.closeAllDropdowns();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      // Close nav dropdowns
      this.navItems.forEach(i => {
        if (i.hasDropdown) {
          i.showDropdown = false;
        }
      });

      // Close store dropdown
      this.isStoreOpen = false;
    }
  }


  onLanguageChange(event: any) {
    const lang = event.target.value;
    // استدعاء دالة Google Translate
    if (window && (window as any).changeLanguage) {
      (window as any).changeLanguage(lang);
    }
  }
}
