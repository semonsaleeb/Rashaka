import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

interface Product {
  id: number;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  image: string;
  isLimitedOffer: boolean;
}

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './special-offers.html',
  styleUrls: ['./special-offers.scss']
})
export class SpecialOffersComponent{

  // Countdown timer properties
  days: number = 1;
  hours: number = 6;
  minutes: number = 20;
  seconds: number = 10;

  private timerSubscription: Subscription | undefined;

  // Products data
  products: Product[] = [
    {
      id: 1,
      title: 'قهوة كريس الخضراء للتنحيف 1+3',
      description: 'قهوة كريس الخضراء للتنحيف من أقوى منتجات التخسيس',
      originalPrice: 230,
      discountedPrice: 230,
      image: 'assets/Images/coffe.jpeg',
      isLimitedOffer: true
    },
    {
      id: 2,
      title: 'قهوة كريس الخضراء للتنحيف 1+3',
      description: 'قهوة كريس الخضراء للتنحيف من أقوى منتجات التخسيس',
      originalPrice: 230,
      discountedPrice: 230,
      image: 'assets/Images/coffe.jpeg',
      isLimitedOffer: true
    },
    {
      id: 3,
      title: 'قهوة كريس الخضراء للتنحيف 1+3',
      description: 'قهوة كريس الخضراء للتنحيف من أقوى منتجات التخسيس',
      originalPrice: 230,
      discountedPrice: 230,
      image: 'assets/Images/coffe.jpeg',
      isLimitedOffer: true
    }
  ];

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private startCountdown(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });
  }

  private updateCountdown(): void {
    if (this.seconds > 0) {
      this.seconds--;
    } else if (this.minutes > 0) {
      this.minutes--;
      this.seconds = 59;
    } else if (this.hours > 0) {
      this.hours--;
      this.minutes = 59;
      this.seconds = 59;
    } else if (this.days > 0) {
      this.days--;
      this.hours = 23;
      this.minutes = 59;
      this.seconds = 59;
    }
  }

  addToCart(product: Product): void {
    console.log('Adding to cart:', product);
    // Implement cart functionality here
  }

  toggleWishlist(product: Product): void {
    console.log('Toggle wishlist:', product);
    // Implement wishlist functionality here
  }

  shareProduct(product: Product): void {
    console.log('Share product:', product);
    // Implement share functionality here
  }

  previousSlide(): void {
    console.log('Previous slide');
    // Implement carousel navigation
  }

  nextSlide(): void {
    console.log('Next slide');
    // Implement carousel navigation
  }

}
