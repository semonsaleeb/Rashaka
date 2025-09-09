import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; // ✅

import { Downloadapp } from './downloadapp/downloadapp';
import { Checkup } from './checkup/checkup';
import { Footer } from '../../footer/footer';
import { Header } from '../../header/header';
import { Pricing } from './pricing/pricing';
import { Hero } from './hero/hero';
import { OurService } from './our-service/our-service';
import { Branches } from './branches/branches';
import { SucesStory } from './suces-story/suces-story';
import { PostHero } from './post-hero/post-hero';
import { Blogs } from './blogs/blogs';
import { SpecialOffersComponent } from './special-offers/special-offers';
import { CategoryProducts } from './category-products/category-products';
import { FavoriteService } from '../../services/favorite.service';
import { Product } from '../../../models/Product';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterOutlet,
    Downloadapp,
    Checkup,
    Pricing,
    Hero,
    OurService,
    Branches,
    SucesStory,
    PostHero,
    Blogs,
    SpecialOffersComponent,
    CategoryProducts,
    TranslateModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  products: Product[] = [];
  favorites: Product[] = [];
  currentLang = 'ar';
  showComparePopup = false;
  compareProducts: Product[] = [];

  constructor(
    private favoriteService: FavoriteService,
    private languageService: LanguageService,
    private translate: TranslateService // ✅
  ) {}

  ngOnInit(): void {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang); // ✅ غير اللغة وقت ما تتغير
      console.log('🌍 Language in HomeComponent:', lang);
    });

    const token = localStorage.getItem('token');
    console.log('Token:', token);

    if (token) {
      this.favoriteService.loadFavorites(token).subscribe(favs => {
        this.favorites = favs;
        this.markFavorites();
      });
    } else {
      const localFavs = this.favoriteService.getLocalFavorites();
      this.favorites = localFavs;
      this.markFavorites();
    }
  }

  private markFavorites(): void {
    this.products.forEach(p => {
      p.isFavorite = this.favorites.some(f => f.id === p.id);
    });
  }

  toggleFavorite(product: Product): void {
    const token = localStorage.getItem('token');

    this.favoriteService.toggleFavorite(product, token).subscribe(() => {
      product.isFavorite = !product.isFavorite;
      if (product.isFavorite) {
        this.favorites.push(product);
      } else {
        this.favorites = this.favorites.filter(f => f.id !== product.id);
      }
    });
  }

  clearFavorites(): void {
    const token = localStorage.getItem('token');

    this.favoriteService.clearFavorites(token).subscribe(() => {
      this.favorites = [];
      this.products.forEach(p => (p.isFavorite = false));
    });
  }
}
