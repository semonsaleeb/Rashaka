import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingService } from '../../../services/pricing.service';
import { SucesStory } from '../suces-story/suces-story';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, SucesStory],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.scss']
})
export class Pricing implements OnInit, AfterViewInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';
  selectedPlan: string = 'session';
  plans: any[] = [];
  groupedPlans: any[][] = [];
  isLoading = false;
  currentSlideIndex = 0;
  cardsPerSlide = 3;

  @ViewChild('carouselInner') carouselInner!: ElementRef;

  constructor(private pricingService: PricingService) { }

  ngOnInit(): void {
    this.loadPackages();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToCurrentSlide(), 100);
  }

  loadPackages(): void {
    this.isLoading = true;
    this.pricingService.getPackages(this.selectedPlan).subscribe({
      next: res => {
        this.plans = res.packages.map((pkg: any, index: number) => ({
          id: pkg.id,
          type: pkg.type,
          title: pkg.name,
          price: pkg.price_after || pkg.price_before,
          sessions: pkg.features.length,
          cities: this.formatCities(pkg.cities),
          features: pkg.features.map((f: any) => f.text_ar),
          styleType: ['basic', 'premium', 'standard'][index % 3]
        }));

        this.groupedPlans = this.chunkArray(this.plans, this.cardsPerSlide);
        this.currentSlideIndex = 0;
        this.isLoading = false;
        setTimeout(() => this.scrollToCurrentSlide(), 100);
      },
      error: err => {
        console.error('Failed to load packages', err);
        this.isLoading = false;
      }
    });
  }

  private chunkArray(arr: any[], size: number): any[][] {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.groupedPlans.length) % this.groupedPlans.length;
    this.scrollToCurrentSlide();
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.groupedPlans.length;
    this.scrollToCurrentSlide();
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.scrollToCurrentSlide();
  }

  private scrollToCurrentSlide(): void {
    if (!this.carouselInner) return;
    const container = this.carouselInner.nativeElement;
    const slide = container.querySelectorAll('.carousel-item')[this.currentSlideIndex];
    if (slide) {
      container.scrollTo({
        left: slide.offsetLeft,
        behavior: 'smooth'
      });
    }
  }

  getDotsArray(): number[] {
    return Array.from({ length: this.groupedPlans.length }, (_, i) => i);
  }

  changePlanType(type: string): void {
    this.selectedPlan = type;
    this.currentSlideIndex = 0;
    this.loadPackages();
  }

  subscribe(planId: number): void {
    this.pricingService.subscribeToPackage(planId).subscribe({
      next: () => alert('تم الاشتراك بنجاح'),
      error: () => alert('حدث خطأ أثناء الاشتراك')
    });
  }

  formatCities(cities: any[]): string {
    if (!cities || cities.length === 0) return 'كل المدن';
    return cities.map(city => city.name_ar || city.name).join('، ');
  }

  @ViewChild('carouselTrack', { static: false }) carouselTrack!: ElementRef;

visibleCards: number = 3; // عدد الكروت الظاهرة في كل سطر

scrollLeft(): void {
  if (this.currentSlideIndex > 0) {
    this.currentSlideIndex--;
  }
}




scrollRight(): void {
  const maxIndex = this.plans.length - this.visibleCards;
  if (this.currentSlideIndex < maxIndex) {
    this.currentSlideIndex++;
  }
}



expandedPlans: number[] = [];

toggleExpand(planId: number): void {
  const index = this.expandedPlans.indexOf(planId);
  if (index === -1) {
    this.expandedPlans.push(planId);
  } else {
    this.expandedPlans.splice(index, 1);
  }
}

isExpanded(planId: number): boolean {
  return this.expandedPlans.includes(planId);
}

}
