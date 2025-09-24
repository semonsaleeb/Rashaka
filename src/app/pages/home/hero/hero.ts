import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, TranslateModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero implements OnInit {
  currentLang: string = 'ar';
  currentSlide: number = 0;

  // Slider images
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

  constructor(private router: Router, private languageService: LanguageService) {}

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();

    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  navigateToReservation() {
    this.router.navigate(['/reservation/free']);
  }

  onGetStarted() {
    this.router.navigate(['/reservation/free']);
  }

nextSlide() {
  if (this.currentSlide < this.sliderImages.length - 1) {
    this.currentSlide++;
  }
}

prevSlide() {
  if (this.currentSlide > 0) {
    this.currentSlide--;
  }
}

  goToSlide(index: number) {
    this.currentSlide = index;
  }
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
      // يمين في LTR أو شمال في RTL -> previous
      this.prevSlide();
    } else {
      // شمال في LTR أو يمين في RTL -> next
      this.nextSlide();
    }
  }
}



onPointerDown(event: PointerEvent) {
  this.isDragging = true;
  this.touchStartX = event.clientX;
}


onPointerMove(event: PointerEvent) {
  if (!this.isDragging) return;
  this.touchEndX = event.clientX;
}


getClientX(event: MouseEvent | TouchEvent): number {
  if (event instanceof MouseEvent) {
    return event.clientX;
  } else {
    return event.changedTouches[0].clientX;
  }
}




isDragging = false;
onPointerUp(event: PointerEvent) {
  if (!this.isDragging) return;
  this.touchEndX = event.clientX;
  this.isDragging = false;
  this.handleSwipeDesktop();
}

handleSwipeDesktop() {
  const swipeDistance = this.touchEndX - this.touchStartX;
  const isRTL = this.currentLang === 'ar';

  if (Math.abs(swipeDistance) < 30) return; // ignore tiny drags

  if ((swipeDistance < 0 && !isRTL) || (swipeDistance > 0 && isRTL)) {
    this.nextSlide(); // swipe left in LTR OR swipe right in RTL
  } else {
    this.prevSlide(); // swipe right in LTR OR swipe left in RTL
  }
}



}
