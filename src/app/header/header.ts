import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit {
  selectedLanguage = 'العربية';
  searchQuery = '';
  isLoggedIn = false;

  navItems = [
    { label: 'الرئيسية', active: true },
    { label: 'المتجر', hasDropdown: true },
    { label: 'الدورات', hasDropdown: true },
    { label: 'قصص نجاح عملائنا', hasDropdown: true },
    { label: 'المدونات', hasDropdown: true },
    { label: 'الخدمات الطبية', hasDropdown: false },
    { label: 'العروض', hasDropdown: false },
    { label: 'عن الشركة', hasDropdown: false }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  onLanguageChange(event: any) {
    this.selectedLanguage = event.target.value;
    console.log('Language changed to:', this.selectedLanguage);
    // Future: integrate i18n here
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Future: route to search results page
    }
  }

  onWhatsAppClick() {
    window.open('https://wa.me/+966123456789', '_blank');
  }

  onNavItemClick(item: any) {
    this.navItems.forEach(navItem => navItem.active = false);
    item.active = true;
    console.log('Navigation clicked:', item.label);
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        console.error('Logout failed', err);
      }
    });
  }
}
