import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
@Component({
  selector: 'app-hero',
  imports: [CommonModule, TranslateModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero implements OnInit {
  isArabic: boolean = true;
  currentSlide: number = 0;

  // Slider images
  sliderImages = [
    { src: 'assets/Images/536783.png', alt: 'صورة الصحة 1' },
    { src: 'assets/Images/Doctor.svg', alt: 'صورة الصحة 2' }
  ];

  // Feature keys for translation
  features: string[] = [
    'FEATURES.FREE_CHECKUP',
    'FEATURES.WEEKLY_FOLLOWUP',
    'FEATURES.HEALTHY_PRODUCTS'
  ];

  constructor(private router: Router, private languageService: LanguageService) {}

  ngOnInit(): void {
    // Set initial direction
    this.isArabic = this.languageService.getCurrentLanguage() === 'ar';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.isArabic = lang === 'ar';
    });
  }

  navigateToReservation() {
    this.router.navigate(['/reservation/all']);
  }

  onGetStarted() {
   this.router.navigate(['/reservation/all']);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.sliderImages.length;
  }

  prevSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.sliderImages.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }
}
