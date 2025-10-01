import { Component, HostListener, Input } from '@angular/core';
import { SuccessStory } from '../../../../models/SuccessStory';
import { ClientReview } from '../../../../models/ClientReview';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SuccessStoryService } from '../../../services/success-story';
import { LanguageService } from '../../../services/language.service';
import { SafeUrlPipe } from '../../../pipes/SafeUrlPipe';
import { TruncatePipe } from '../../../truncate-pipe';
import { RouterModule } from '@angular/router';
import { Branches } from '../branches/branches';
import { Checkup } from '../checkup/checkup';
import { Downloadapp } from '../downloadapp/downloadapp';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-opinion',
  imports: [CommonModule,  RouterModule, TranslateModule, SafeUrlPipe],
  templateUrl: './client-opinion.html',
  styleUrl: './client-opinion.scss'
})
export class ClientOpinion {
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';

  @Input() mode: 'carousel' | 'grid' = 'grid';

  isMobile = false;

  // ✅ بيانات من الـ API
  stories: SuccessStory[] = [];   // قصص النجاح
  reviews: ClientReview[] = [];   // آراء العملاء

  // ✅ مؤشرات منفصلة لكل قسم
  currentStoryIndex = 0;    // لقصص النجاح
  currentReviewIndex = 0;   // لآراء العملاء

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

  // ✅ دوال قصص النجاح
  getStoryCardClass(index: number): string {
    if (this.stories.length <= 1) return 'center';

    const total = this.stories.length;
    const prev = (this.currentStoryIndex - 1 + total) % total;
    const next = (this.currentStoryIndex + 1) % total;

    if (index === this.currentStoryIndex) return 'center';
    if (index === prev) return 'left';
    if (index === next) return 'right';
    return 'hidden';
  }

  nextStory(): void {
    this.currentStoryIndex = (this.currentStoryIndex + 1) % this.stories.length;
  }

  prevStory(): void {
    this.currentStoryIndex = (this.currentStoryIndex - 1 + this.stories.length) % this.stories.length;
  }

  goToStory(index: number): void {
    this.currentStoryIndex = index;
  }

  // ✅ دوال آراء العملاء
// ✅ دوال آراء العملاء
getReviewCardClass(i: number): string {
  const total = this.reviews.length;
  const prev = (this.currentReviewIndex - 1 + total) % total;
  const next = (this.currentReviewIndex + 1) % total;

  if (i === this.currentReviewIndex) return 'active';
  if (i === prev) return 'left';
  if (i === next) return 'right';
  return 'hidden';
}

// 🟢 Helper function: Pause all videos except active
pauseInactiveVideos(): void {
  const videos: NodeListOf<HTMLVideoElement> = document.querySelectorAll('.review-card-custom video');
  const iframes: NodeListOf<HTMLIFrameElement> = document.querySelectorAll('.review-card-custom iframe');

  videos.forEach((video, index) => {
    if (index !== this.currentReviewIndex) {
      video.pause();
    }
  });

  iframes.forEach((iframe, index) => {
    if (index !== this.currentReviewIndex) {
      // Reset src to stop YouTube
      const src = iframe.src;
      iframe.src = src;
    }
  });
}

nextReview(): void {
  this.currentReviewIndex = (this.currentReviewIndex + 1) % this.reviews.length;
  this.pauseInactiveVideos();
}

prevReview(): void {
  this.currentReviewIndex = (this.currentReviewIndex - 1 + this.reviews.length) % this.reviews.length;
  this.pauseInactiveVideos();
}

goToReview(index: number): void {
  this.currentReviewIndex = index;
  this.pauseInactiveVideos();
}


  // ✅ Swipe functions لكل قسم
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent, type: 'story' | 'review'): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe(type);
  }

  handleSwipe(type: 'story' | 'review'): void {
    const swipeDistance = this.touchStartX - this.touchEndX;
    if (swipeDistance > 50) {
      type === 'story' ? this.nextStory() : this.nextReview();
    }
    if (swipeDistance < -50) {
      type === 'story' ? this.prevStory() : this.prevReview();
    }
  }
//   getReviewCardClass(i: number): string {
//   if (i === this.currentReviewIndex) return 'active';
//   return 'hidden';
// }

// goToReview(index: number): void {
//   this.currentReviewIndex = index;
// }

}



