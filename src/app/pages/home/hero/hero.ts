import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero { currentSlide: number = 0;
  
 sliderImages = [
  { src: 'assets/Images/536783.png', alt: 'صورة الصحة 1' },
  { src: 'assets/Images/536783.png', alt: 'صورة الصحة 2' },
  { src: 'assets/Images/536783.png', alt: 'صورة الصحة 3' },
  { src: 'assets/Images/536783.png', alt: 'صورة الصحة 4' }
];

  constructor() { }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.sliderImages.length;
  }

  prevSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.sliderImages.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  onGetStarted() {
    console.log('Get started clicked');
    // Add your navigation logic here
  }
}