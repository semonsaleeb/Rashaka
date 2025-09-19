import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Components
import { Header } from './header/header';
import { Hero } from './pages/home/hero/hero';
import { PostHero } from './pages/home/post-hero/post-hero';
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
import { CategoryProducts } from './pages/home/category-products/category-products';
import { OurService } from './pages/home/our-service/our-service';
import { SucesStory } from './pages/home/suces-story/suces-story';
import { Branches } from './pages/home/branches/branches';
import { ProductCard } from './product-card/product-card';
import { Checkup } from './pages/home/checkup/checkup';
import { Pricing } from './pages/home/pricing/pricing';
import { Blogs } from './pages/home/blogs/blogs';
import { Downloadapp } from './pages/home/downloadapp/downloadapp';
import { Footer } from './footer/footer';
import { Home } from './pages/home';
import { WelcomePopup } from './welcome-popup/welcome-popup';
import { CartSidebar } from './cart-sidebar/cart-sidebar';

// Services
import { CartStateService } from './services/cart-state-service';
import { LanguageService } from './services/language.service';

// Translate
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Footer,
    Header,
    WelcomePopup,
    CartSidebar,
    TranslateModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  cartItems: any[] = [];

  constructor(
    private cartState: CartStateService,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {
    // إعداد اللغات
    translate.addLangs(['en', 'ar']);
    translate.setDefaultLang('ar');

    const savedLang = this.languageService.getCurrentLanguage();
    translate.use(savedLang);
  }

  ngOnInit() {
    // 👇 تحديث الكارت عند أي تغيير
    this.cartState.cartItems$.subscribe(items => {
      this.cartItems = items;
      console.log("cart items : " ,items);
      
    });
  }
}