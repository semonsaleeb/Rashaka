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

  navItems = [
    { label: 'الرئيسية', path: '/', active: false },
    { label: 'المتجر', path: '/shop', hasDropdown: true },
    { label: 'الاشتراكات', path: '/courses', hasDropdown: false },
    { label: 'قصص نجاح عملائنا', path: '/home/sucesStory', hasDropdown: false },
    { label: 'الفحوصات المجانيه', path: '/blogs', hasDropdown: false },
    { label: 'العروض', path: '/home/special-offers', hasDropdown: false },
    { label: 'المدونة ', path: '/home/blogs', hasDropdown: false }
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private favoriteService: FavoriteService,
    private cartService: CartService,             // ✅ Inject CartService
    private cartState: CartStateService           // ✅ Inject CartStateService
  ) {}

  ngOnInit() {
    this.updateCartCount(); // ✅ Initial cart count

    // Subscribe to cart count
    this.cartState.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    // Subscribe to favorite count
    this.favoriteService.favoriteCount$.subscribe(count => {
      this.favoriteCount = count;
    });

    // Check login status
    this.auth.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;

      if (this.isLoggedIn) {
        const clientData = localStorage.getItem('client');
        if (clientData) {
          this.client = JSON.parse(clientData);
        }
      } else {
        this.client = null;
      }
    });
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

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Navigate to search results if needed
    }
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
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        console.error('Logout failed', err);
        localStorage.removeItem('token');
        localStorage.removeItem('client');
        this.router.navigate(['/auth']);
      }
    });
  }
}
