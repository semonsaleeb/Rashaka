import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';

import { Hero } from './pages/home/hero/hero';
import { PostHero } from './pages/home/post-hero/post-hero';
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
import { CategoryProducts } from './pages/home/category-products/category-products';
import { OurService } from './pages/home/our-service/our-service';
import { SucesStory } from './pages/home/suces-story/suces-story';
import { Branches } from './pages/home/branches/branches';
import { ProductCard } from "./product-card/product-card";
import { Product, ProductService } from './services/product';
import { Checkup } from './pages/home/checkup/checkup';
import { Pricing } from './pages/home/pricing/pricing';
import { Blogs } from './pages/home/blogs/blogs';
import { Downloadapp } from './pages/home/downloadapp/downloadapp';
import { Footer } from './footer/footer';
import { Home } from './pages/home';
import { WelcomePopup } from './welcome-popup/welcome-popup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Footer, Header, WelcomePopup],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

//   products: Product[] = [];

// constructor(private productService: ProductService) {}

// ngOnInit() {
//   this.productService.getProducts().subscribe((data) => {
//     this.products = data;
//   });
// }

}
