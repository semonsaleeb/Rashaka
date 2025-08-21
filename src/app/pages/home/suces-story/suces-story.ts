import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Downloadapp } from '../downloadapp/downloadapp';
import { Checkup } from '../checkup/checkup';
import { Branches } from '../branches/branches';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-suces-story',
  imports: [CommonModule, Downloadapp, Checkup, Branches, RouterModule],
  templateUrl: './suces-story.html',
  styleUrl: './suces-story.scss'
})
export class SucesStory {
      @Input() mode: 'carousel' | 'grid' = 'grid';

  isMobile = false;
  currentIndex = 0;

stories = [
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



  constructor(private sanitizer: DomSanitizer) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

getSafeYoutubeUrl(id: string | undefined) {
  if (!id) return ''; // أو ممكن ترجع null
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


// لو عايز تحرك يمين/شمال برضه
nextSlide() {
  if (this.currentIndex < this.stories.length - 1) {
    this.currentIndex++;
  } else {
    this.currentIndex = 0; // يرجع لأول فيديو
  }
}

prevSlide() {
  if (this.currentIndex > 0) {
    this.currentIndex--;
  } else {
    this.currentIndex = this.stories.length - 1; // آخر فيديو
  }
}


  goToSlide(index: number) {
    this.currentIndex = index;
  }



  // component.ts
touchStartX = 0;
touchEndX = 0;

onTouchStart(event: TouchEvent) {
  this.touchStartX = event.changedTouches[0].screenX;
}

onTouchEnd(event: TouchEvent) {
  this.touchEndX = event.changedTouches[0].screenX;
  this.handleSwipe();
}

handleSwipe() {
  const swipeDistance = this.touchStartX - this.touchEndX;
  if (swipeDistance > 50) {
    this.nextSlide(); // سحب لليسار
  }
  if (swipeDistance < -50) {
    this.prevSlide(); // سحب لليمين
  }
}

}
