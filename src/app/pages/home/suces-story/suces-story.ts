import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Downloadapp } from '../downloadapp/downloadapp';
import { Checkup } from '../checkup/checkup';
import { Branches } from '../branches/branches';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

// Models
import { SuccessStory } from '../../../../models/SuccessStory';
import { ClientReview } from '../../../../models/ClientReview';

// Service
import { SuccessStoryService } from '../../../services/success-story';
import { SafeUrlPipe } from '../../../pipes/SafeUrlPipe';

@Component({
  selector: 'app-suces-story',
  imports: [CommonModule, Downloadapp, Checkup, Branches, RouterModule, TranslateModule, SafeUrlPipe ],
  templateUrl: './suces-story.html',
  styleUrl: './suces-story.scss'
})
export class SucesStory {
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // default direction

  @Input() mode: 'carousel' | 'grid' = 'grid';

  isMobile = false;
  currentIndex = 0;

  // ✅ بيانات من الـ API
  stories: SuccessStory[] = [];   // قصص النجاح
  reviews: ClientReview[] = [];   // آراء العملاء

  // swipe
  touchStartX = 0;
  touchEndX = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private languageService: LanguageService,
    private successStoryService: SuccessStoryService,
  ) {
    this.checkScreenSize();
  }


currentReviewIndex = 0;

nextReview(): void {
  if (this.reviews.length > 0) {
    this.currentReviewIndex =
      (this.currentReviewIndex + 1) % this.reviews.length;
  }
}

prevReview(): void {
  if (this.reviews.length > 0) {
    this.currentReviewIndex =
      (this.currentReviewIndex - 1 + this.reviews.length) % this.reviews.length;
  }
}


  ngOnInit(): void {
    this.translate.use(this.languageService.getCurrentLanguage());

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.translate.use(lang);
    });

    // ✅ تحميل القصص و الريفيوز
    this.loadStories();
    this.loadReviews();
  }

  // 🟢 تحميل قصص النجاح
  loadStories(): void {
    this.successStoryService.getSuccessStories().subscribe({
      next: (data) => this.stories = data,
      error: (err) => console.error('Failed to load success stories', err)
    });
  }

  // 🟢 تحميل الريفيوز
  loadReviews(): void {
    this.successStoryService.getClientReviews().subscribe({
      next: (data) => this.reviews = data,
      error: (err) => console.error('Failed to load client reviews', err)
    });
  }

  // ✅ Helpers for UI
  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  getCardClass(index: number): string {
    if (this.stories.length <= 1) return 'center';

    const total = this.stories.length;
    const prev = (this.currentIndex - 1 + total) % total;
    const next = (this.currentIndex + 1) % total;

    if (index === this.currentIndex) return 'center';
    if (index === prev) return 'left';
    if (index === next) return 'right';
    return 'hidden';
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.stories.length;
  }

  prevSlide(): void {
    this.currentIndex = (this.currentIndex - 1 + this.stories.length) % this.stories.length;
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe(): void {
    const swipeDistance = this.touchStartX - this.touchEndX;
    if (swipeDistance > 50) this.nextSlide();
    if (swipeDistance < -50) this.prevSlide();
  }

  // لو استخدمنا يوتيوب مستقبلاً
  // getSafeYoutubeUrl(id?: string) {
  //   if (!id) return '';
  //   return this.sanitizer.bypassSecurityTrustResourceUrl(
  //     `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
  //   );
  // }
  
}
