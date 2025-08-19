import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branches',
  imports: [CommonModule, RouterModule],
  templateUrl: './branches.html',
  styleUrl: './branches.scss'
})
export class Branches {
branches: string[] = ['الخبر', 'الدمام', 'الأحساء', 'جدة', 'القصيم', 'الخرج', 'الرياض'];
selectedBranch: string = 'الرياض';

selectBranch(branch: string): void {
  this.selectedBranch = branch;
}

locations = [
  {
    phone: '966-920013458',
    image: 'assets/Images/Frame 37.svg',
    title: 'أولي فروعنا',
    location: 'الرياض – الرياض النخيل',
    description: 'مركز العناية بالشعر و التجميل'
  },
  {
    phone: '966-920013458',
    image: 'assets/Images/Frame 37.svg',
    title: 'رابع فروعنا',
    location: 'الدمام – حي الشاطئ',
    description: 'مركز متكامل للعناية بالشعر'
  },
  {
    phone: '966-920013458',
    image: 'assets/Images/Frame 37.svg',
    title: 'ثاني فروعنا',
    location: 'جدة – حي الروضة',
    description: 'مركز التجميل والعناية بالبشرة'
  },
  {
    phone: '966-920013458',
    image: 'assets/Images/Frame 37.svg',
    title: 'ثالث فروعنا',
    location: 'الدمام – حي الشاطئ',
    description: 'مركز متكامل للعناية بالشعر'
  }
];

branchSlideIndex = 0;
visibleBranchCards = 3;

nextSlide() {
  if (this.branchSlideIndex > 0) {
    this.branchSlideIndex--;
  }
}

prevSlide() {
  const maxSlide = this.locations.length - this.visibleBranchCards;
  if (this.branchSlideIndex < maxSlide) {
    this.branchSlideIndex++;
  }
}
getBranchDotsArray(): number[] {
  const totalSlides = Math.ceil(this.locations.length / this.visibleBranchCards);
  return Array.from({ length: totalSlides }, (_, i) => i);
}
goToBranchSlide(index: number): void {
  this.branchSlideIndex = index;
}





ngOnInit(): void {
  this.updateVisibleBranchCards();
  window.addEventListener('resize', this.updateVisibleBranchCards.bind(this));
}

updateVisibleBranchCards(): void {
  const width = window.innerWidth;

  if (width < 576) {
    this.visibleBranchCards = 1;   // موبايل
  } else if (width >= 576 && width < 768) {
    this.visibleBranchCards = 2;   // تابلت
  } else {
    this.visibleBranchCards = 3;   // لابتوب وديسكتوب
  }
}



getMaxBranchSlideIndex(): number {
  // عدد السلايدز - عدد الكروت الظاهرة
  return Math.max(0, this.locations.length - this.visibleBranchCards);
}
touchStartX = 0;
touchEndX = 0;

onTouchStart(event: TouchEvent): void {
  this.touchStartX = event.changedTouches[0].screenX;
}

onTouchEnd(event: TouchEvent): void {
  this.touchEndX = event.changedTouches[0].screenX;
  this.handleSwipe();
}

handleSwipe(): void {
  const swipeDistance = this.touchEndX - this.touchStartX;

  if (Math.abs(swipeDistance) > 50) { // عتبة عشان ما يعتبرش اللمسة العادية Swipe
    if (swipeDistance > 0) {
      // 👉 Swipe يمين → روح للسابق
      this.prevSlide();
    } else {
      // 👈 Swipe شمال → روح للي بعده
      this.nextSlide();
    }
  }
}

}
