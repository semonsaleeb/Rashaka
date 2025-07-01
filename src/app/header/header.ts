import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
selectedLanguage = 'العربية';
  searchQuery = '';

  // Navigation items
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

  onLanguageChange(event: any) {
    this.selectedLanguage = event.target.value;
    // Implement language switching logic here
    console.log('Language changed to:', this.selectedLanguage);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', this.searchQuery);
    }
  }

  onWhatsAppClick() {
    // Open WhatsApp - replace with your actual WhatsApp number
    window.open('https://wa.me/+966123456789', '_blank');
  }

  onNavItemClick(item: any) {
    // Handle navigation click
    console.log('Navigation clicked:', item.label);
    // Reset active states
    this.navItems.forEach(navItem => navItem.active = false);
    // Set clicked item as active
    item.active = true;
  }
}
