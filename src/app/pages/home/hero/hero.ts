import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss']
})
export class Hero implements OnInit, OnDestroy {
  currentLang: string = 'ar';
  currentSlide: number = 0;
  autoSlideInterval: any;
  isDragging = false;

  // صور السلايدر
  sliderImages = [
    { src: 'assets/Images/536783.png', alt: 'صورة الصحة 1' },
    { src: 'assets/Images/536783.png', alt: 'صورة الصحة 2' },
    { src: 'assets/Images/536783.png', alt: 'صورة الصحة 3' }
  ];

  features: string[] = [
    'FEATURES.FREE_CHECKUP',
    'FEATURES.WEEKLY_FOLLOWUP',
    'FEATURES.HEALTHY_PRODUCTS'
  ];

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });

    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    clearInterval(this.autoSlideInterval);
  }

  // ✅ Auto Slide
  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 3000);
  }

  stopAutoSlide(): void {
    clearInterval(this.autoSlideInterval);
  }

  // ✅ التنقل
  navigateToReservation() {
    this.router.navigate(['/reservation/free']);
  }

  onGetStarted() {
    this.router.navigate(['/reservation/free']);
  }

  nextSlide() {
    if (this.currentSlide < this.sliderImages.length - 1) {
      this.currentSlide++;
    } else {
      this.currentSlide = 0;
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    } else {
      this.currentSlide = this.sliderImages.length - 1;
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  // ======================== TOUCH SWIPE ========================
  touchStartX = 0;
  touchEndX = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;
    if (Math.abs(swipeDistance) > 50) {
      const isRTL = this.currentLang === 'ar';
      if ((swipeDistance > 0 && !isRTL) || (swipeDistance < 0 && isRTL)) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    }
  }

  // ======================== POINTER SWIPE (DESKTOP) ========================
  onPointerDown(event: PointerEvent) {
    this.isDragging = true;
    this.touchStartX = event.clientX;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;
    this.touchEndX = event.clientX;
  }

  onPointerUp(event: PointerEvent) {
    if (!this.isDragging) return;
    this.touchEndX = event.clientX;
    this.isDragging = false;
    this.handleSwipeDesktop();
  }

  handleSwipeDesktop() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    const isRTL = this.currentLang === 'ar';
    if (Math.abs(swipeDistance) < 30) return;

    if ((swipeDistance < 0 && !isRTL) || (swipeDistance > 0 && isRTL)) {
      this.nextSlide();
    } else {
      this.prevSlide();
    }
  }
}
