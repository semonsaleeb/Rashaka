import { Component, OnInit } from '@angular/core';
import { CartStateService } from '../services/cart-state-service';
import { CartService } from '../services/cart.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';


@Component({
  selector: 'app-cart-icon.component',
  imports: [],
  templateUrl: './cart-icon.component.html',
  styleUrl: './cart-icon.component.scss'
})
export class CartIconComponent implements OnInit {
  cartCount = 0;
  showDropdown = false;
  cartItems: any[] = [];

  constructor(
    public cartState: CartStateService,
    private cartService: CartService,
    private translate: TranslateService, private languageService: LanguageService
  ) {}


  
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

  ngOnInit(): void {
    this.cartState.cartCount$.subscribe(count => this.cartCount = count);

     this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.cartService.getCart().subscribe(response => {
        this.cartItems = response.data.items;
      });
    }
  }
}


