import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwiperContainer } from 'swiper/element';
import { register } from 'swiper/element/bundle';
import { SwiperOptions } from 'swiper/types';

// Register Swiper web components
register();
@Component({
  selector: 'app-suces-story',
  imports: [CommonModule, ],
  templateUrl: './suces-story.html',
  styleUrl: './suces-story.scss'
})
export class SucesStory {
  currentIndex = 0;

  stories = [
  {
    id: 1,
    src: 'assets/videos/story1.mp4',
    poster: 'assets/images/thumb1.jpg' // Optional thumbnail
  },
  {
    id: 2,
    src: 'assets/videos/story2.mp4',
    poster: 'assets/images/thumb2.jpg'
  },
  {
    id: 3,
    src: 'assets/videos/story3.mp4',
    poster: 'assets/images/thumb3.jpg'
  },
  {
    id: 4,
    src: 'assets/videos/story4.mp4',
    poster: 'assets/images/thumb4.jpg'
  }
];
get groupedStories() {
  const result = [];
  for (let i = 0; i < this.stories.length; i += 4) {
    result.push(this.stories.slice(i, i + 4));
  }
  return result;
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
}
