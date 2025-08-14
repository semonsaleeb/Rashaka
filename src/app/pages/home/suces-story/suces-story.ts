import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwiperContainer } from 'swiper/element';
import { register } from 'swiper/element/bundle';
import { SwiperOptions } from 'swiper/types';
import { DomSanitizer } from '@angular/platform-browser';
import { Downloadapp } from '../downloadapp/downloadapp';
import { Checkup } from '../checkup/checkup';
import { Branches } from '../branches/branches';

// Register Swiper web components
register();
@Component({
  selector: 'app-suces-story',
  imports: [CommonModule, Downloadapp, Checkup, Branches ],
  templateUrl: './suces-story.html',
  styleUrl: './suces-story.scss'
})
export class SucesStory {
    @Input() mode: 'carousel' | 'grid' = 'grid';

  
  currentIndex = 0;

  stories = [
  {
    id: 1,
    youtubeId: 'abc123',
    title: 'قصة نجاح ١',
    description: 'تجربة رائعة',
    image: 'assets/Images/Group 9025.svg'
  },
  {
    id: 2,
    youtubeId: 'def456',
    title: 'قصة نجاح ٢',
    description: 'نتائج مبهرة',
    image: 'assets/Images/Group 9025.svg'
  },
  {
    id: 3,
    youtubeId: 'y6120QOlsfU',
    title: 'قصة نجاح ٣',
    description: 'تجربة ملهمة',
    image: 'assets/Images/Group 9025.svg'
  }
];


  constructor(private sanitizer: DomSanitizer) {}

  getSafeYoutubeUrl(id: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`

      
    );
  }

  getCardClass(index: number): string {
    const total = this.stories.length;
    const prev = (this.currentIndex - 1 + total) % total;
    const next = (this.currentIndex + 1) % total;

    if (index === this.currentIndex) return 'center';
    if (index === prev) return 'left';
    if (index === next) return 'right';
    return '';
  }
  

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.stories.length;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.stories.length) % this.stories.length;
  }

  goToSlide(index: number) {
    this.currentIndex = index;
  }

    onGetStarted() {
    console.log('Get started clicked');
    // Add your navigation logic here
  }
}