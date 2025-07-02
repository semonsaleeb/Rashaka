import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { CommonModule } from '@angular/common';
import { Hero } from './pages/home/hero/hero';
import { PostHero } from './pages/home/post-hero/post-hero';
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';




@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Header,Hero,PostHero, SpecialOffersComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Rashaka';
}
