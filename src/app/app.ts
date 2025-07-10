// import { Component, OnInit } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { Header } from './header/header';
// import { CommonModule } from '@angular/common';
// import { Hero } from './pages/home/hero/hero';
// import { PostHero } from './pages/home/post-hero/post-hero';
// import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
// import { HttpClientModule } from '@angular/common/http';
// import { ProductCard } from './product-card/product-card';
// import { Product, ProductService } from './services/product';




// @Component({
//   selector: 'app-root',
//   imports: [CommonModule,ProductCard, RouterOutlet, Header,Hero,PostHero, SpecialOffersComponent, HttpClientModule, ],
//   templateUrl: './app.html',
//   styleUrl: './app.scss'
// })
// export class App implements OnInit {
//   products: Product[] = [];
//   isLoading = true;

//   constructor(private productService: ProductService) {}

//   ngOnInit(): void {
//     this.productService.getProducts().subscribe({
//       next: (products) => {
//         this.products = products;
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('Error fetching products:', error);
//         this.isLoading = false;
//       }
//     });
//   }
// }
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { CommonModule } from '@angular/common';
import { Hero } from './pages/home/hero/hero';
import { PostHero } from './pages/home/post-hero/post-hero';
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
import { CategoryProducts } from './pages/home/category-products/category-products';
import { OurService } from './pages/home/our-service/our-service';
import { SucesStory } from './pages/home/suces-story/suces-story';
import { Branches } from './pages/home/branches/branches';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Hero, OurService, Branches, SucesStory, PostHero, SpecialOffersComponent, CategoryProducts],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
