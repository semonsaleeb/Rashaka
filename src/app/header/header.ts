// header.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service'; // ✅ Add this
import {  FavoriteService } from '../services/favorite.service';
import { CartStateService } from '../services/cart-state-service';
import { CartIconComponent } from '../cart-icon.component/cart-icon.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Category, ProductService } from '../services/product';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgbDropdownModule,
    
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit {
  selectedLanguage = 'العربية';
  searchQuery = '';
  isLoggedIn = false;
  client: any = null;
  favoriteCount = 0;
  cartCount = 0;
  categories: Category[] = [];

  navItems = [
  { label: 'الرئيسية', path: '/', active: false },
  { label: 'المتجر', path: '/home/category-products', hasDropdown: true, showDropdown: true },
  { label: 'الاشتراكات', path: '/home/Pricing', hasDropdown: false },
  { label: 'قصص نجاح عملائنا', path: '/home/sucesStory', hasDropdown: false },
  { label: 'الفحوصات المجانيه', path: '/blogs', hasDropdown: false },
  { label: 'العروض', path: '/home/special-offers', hasDropdown: false },
  { label: 'المدونة ', path: '/home/blogs', hasDropdown: false }
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
    private router: Router,
    private http: HttpClient,
    private productService: ProductService,
    private favoriteService: FavoriteService,
    private cartService: CartService,             // ✅ Inject CartService
    private cartState: CartStateService           // ✅ Inject CartStateService
  ) {}

 ngOnInit() {
  this.updateCartCount(); // Cart

  this.cartState.cartCount$.subscribe(count => {
    this.cartCount = count;
  });

  this.favoriteService.favoriteCount$.subscribe(count => {
    this.favoriteCount = count;
  });

  this.auth.isLoggedIn$.subscribe(status => {
    this.isLoggedIn = status;
    const clientData = localStorage.getItem('client');
    this.client = (status && clientData) ? JSON.parse(clientData) : null;
  });

  // ✅ Load categories here
  this.productService.getProducts().subscribe({
    next: (products) => {
      this.categories = this.extractUniqueCategories(products);
    },
    error: (err) => {
      console.error('Failed to fetch products:', err);
    }
  });

  // Show first dropdown
  const defaultNavItem = this.navItems.find(i => i.hasDropdown);
  if (defaultNavItem) {
    this.toggleDropdown(defaultNavItem);
  }
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
        const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
        this.cartState.updateCount(count);
      },
      error: (err) => {
        console.error('Error fetching cart count:', err);
      }
    });
  }

  onLanguageChange(event: any) {
    this.selectedLanguage = event.target.value;
    console.log('Language changed to:', this.selectedLanguage);
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
    console.log('Get started clicked');
    // Add your navigation logic here
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

}
