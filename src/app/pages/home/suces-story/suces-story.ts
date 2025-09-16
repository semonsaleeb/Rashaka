import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Downloadapp } from '../downloadapp/downloadapp';
import { Checkup } from '../checkup/checkup';
import { Branches } from '../branches/branches';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { SuccessStory } from '../../../../models/SuccessStory';
import { SuccessStoryService } from '../../../services/success-story';

@Component({
  selector: 'app-suces-story',
  imports: [CommonModule, Downloadapp, Checkup, Branches, RouterModule, TranslateModule],
  templateUrl: './suces-story.html',
  styleUrl: './suces-story.scss'
})
export class SucesStory {
  
  
Opinions = [
  {
   id: 1,
    localVideo: 'assets/Images/فيديو اعلان فحص الجلسات.mp4',
    type: 'local',
    title: 'قصة نجاح ١',
    description: 'تجربة رائعة',
    image: 'assets/Images/Group 9025.svg'
  },
  {
    id: 2,
    localVideo: 'assets/Images/ام محمد.MP4',
    type: 'local',
    title: 'قصة نجاح ٢',
    description: 'نتائج مبهرة',
    image: 'assets/Images/Group 9025.svg'
  },
  {
    id: 3,
    localVideo: 'assets/Images/تجارب ابطال الرشاقة السعيدة.mp4',
    type: 'local',
    title: 'قصة نجاح ٣',
    description: 'تجربة ملهمة',
    image: 'assets/Images/Group 9025.svg'
  },
  //   {
  //   id: 4,
  //   youtubeId: 'y6120QOlsfU',
  //   type: 'youtube',
  //   title: 'قصة نجاح ٢',
  //   description: 'نتائج مبهرة',
  //   image: 'assets/Images/Group 9025.svg'
  // }
];

@Input() mode: 'carousel' | 'grid' = 'grid';

  isMobile = false;
  currentIndex = 0;
  stories: SuccessStory[] = [];

  // swipe
  touchStartX = 0;
  touchEndX = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private languageService: LanguageService,
    private successStoryService: SuccessStoryService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.translate.use(this.languageService.getCurrentLanguage());

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.translate.use(lang);
    });

    // Load stories from API
    this.loadStories();
  }

  loadStories(): void {
    this.successStoryService.getSuccessStories().subscribe({
      next: (data) => this.stories = data,
      error: (err) => console.error('Failed to load success stories', err)
    });
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

 getCardClass(index: number): string {
  // كل العناصر تظهر في Carousel، حتى لو واحدة
  if (this.stories.length <= 1) return 'center';
  
  const total = this.stories.length;
  const prev = (this.currentIndex - 1 + total) % total;
  const next = (this.currentIndex + 1) % total;

  if (index === this.currentIndex) return 'center';
  if (index === prev) return 'left';
  if (index === next) return 'right';
  return 'hidden'; // العناصر الأخرى يمكن تخفيها أو ضع CSS مناسبة
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

  // getSafeYoutubeUrl(id?: string) {
  //   if (!id) return '';
  //   return this.sanitizer.bypassSecurityTrustResourceUrl(
  //     https://www.youtube.com/embed/${id}?rel=0&modestbranding=1
  //   );
  // }
}