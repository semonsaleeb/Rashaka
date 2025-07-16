import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwiperContainer } from 'swiper/element';
import { register } from 'swiper/element/bundle';
import { SwiperOptions } from 'swiper/types';
import { DomSanitizer } from '@angular/platform-browser';

// Register Swiper web components
register();
@Component({
  selector: 'app-suces-story',
  imports: [CommonModule, ],
  templateUrl: './suces-story.html',
  styleUrl: './suces-story.scss'
})
export class SucesStory {currentIndex = 0;

  stories = [
    {
      id: 1,
      youtubeId: 'lgUZdInfx6U',
      title: 'قصة نجاح ١',
      description: 'تجربة عميل مع منتجاتنا'
    },
    {
      id: 2,
      youtubeId: 'dQw4w9WgXcQ', // Example ID - replace with real one
      title: 'قصة نجاح ٢',
      description: 'رحلة تحول ناجحة'
    },
    {
      id: 3,
      youtubeId: 'y6120QOlsfU', // Example ID - replace with real one
      title: 'قصة نجاح ٣',
      description: 'تجربة ملهمة'
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
}