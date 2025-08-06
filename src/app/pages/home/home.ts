import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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


@Component({
  selector: 'app-home',
  imports: [
    CommonModule, RouterOutlet, Downloadapp, Checkup, Pricing, Hero, OurService, 
    Branches, SucesStory, PostHero,Blogs, SpecialOffersComponent, CategoryProducts
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
ngOnInit(): void {
  const token = localStorage.getItem('token'); // or 'access_token' depending on your app
  console.log('Token:', token);
}

}
