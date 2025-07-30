import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SucesStory } from '../suces-story/suces-story';
import { PricingService } from '../../../services/pricing.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SucesStory],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class Pricing implements OnInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';

  selectedPlan: string = 'session';
  plans: any[] = [];
  isLoading = false;

  currentSlideIndex = 0;
  visibleCards = 3;

@ViewChild('carouselTrack') carouselTrack!: ElementRef;

  constructor(private pricingService: PricingService) { }

  ngOnInit(): void {

    this.loadPackages();
     
  }

  changePlanType(type: string): void {
    this.selectedPlan = type;
    this.currentSlideIndex = 0;
    this.loadPackages();
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
        cities_raw: pkg.cities,
        cities: this.formatCities(pkg.cities),
        features: pkg.features.map((f: any) => f.text_ar),
        styleType: ['basic', 'premium', 'standard'][index % 3]
      }));

      console.log('✅ Loaded Plans:', this.plans.length);
      this.isLoading = false;
    },
    error: err => {
      console.error('❌ Failed to load packages', err);
      this.isLoading = false;
    }
  });
}


  subscribe(planId: number): void {
    this.pricingService.subscribeToPackage(planId).subscribe({
      next: () => alert('✅ تم الاشتراك بنجاح'),
      error: () => alert('❌ حدث خطأ أثناء الاشتراك')
    });
  }

  formatCities(cities: any[]): string {
    if (!cities || cities.length === 0) return 'All Cities';
    return cities.map(city => city.name_ar || city.name).join(', ');
  }

  // Carousel Logic
getDotsArray(): number[] {
  const totalSlides = Math.ceil(this.plans.length / this.visibleCards);
  return Array.from({ length: totalSlides }, (_, i) => i);
}


goToSlide(index: number): void {
  if (!this.carouselTrack?.nativeElement) return;

  const card = this.carouselTrack.nativeElement.querySelector('.card');
  if (!card) return;

  const cardWidth = card.offsetWidth + 16; // 16px for margin/gap
  const scrollAmount = cardWidth * index;

  const container = this.carouselTrack.nativeElement;

  const isRTL = getComputedStyle(container).direction === 'rtl';

  // For RTL we subtract from scrollWidth to scroll "right"
  const totalWidth = container.scrollWidth - container.clientWidth;
  const targetScroll = isRTL ? totalWidth - scrollAmount : scrollAmount;

  this.currentSlideIndex = index;
  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  });
}

  nextSlide(): void {
    console.log("next clik");
    
  if (!this.carouselTrack?.nativeElement) return;

  const container = this.carouselTrack.nativeElement;
  const card = container.querySelector('.card');
  if (!card) return;

  const cardWidth = card.offsetWidth + 16; // Including margin
  const maxScroll = container.scrollWidth - container.clientWidth;
  const isRTL = getComputedStyle(container).direction === 'rtl';

  let newScroll = isRTL
    ? container.scrollLeft - cardWidth
    : container.scrollLeft + cardWidth;

  // Clamp to limits
  newScroll = Math.max(0, Math.min(maxScroll, newScroll));

  container.scrollTo({ left: newScroll, behavior: 'smooth' });

  // Update index (if needed for dots)
  this.currentSlideIndex = isRTL
    ? Math.max(0, this.currentSlideIndex - 1)
    : Math.min(this.currentSlideIndex + 1, this.plans.length - this.visibleCards);
}

prevSlide(): void {
  console.log("prev click");
  
  if (!this.carouselTrack?.nativeElement) return;

  const container = this.carouselTrack.nativeElement;
  const card = container.querySelector('.card');
  if (!card) return;

  const cardWidth = card.offsetWidth + 16;
  const isRTL = getComputedStyle(container).direction === 'rtl';

  let newScroll = isRTL
    ? container.scrollLeft + cardWidth
    : container.scrollLeft - cardWidth;

  newScroll = Math.max(0, newScroll);

  container.scrollTo({ left: newScroll, behavior: 'smooth' });

  // Update index (if needed)
  this.currentSlideIndex = isRTL
    ? Math.min(this.currentSlideIndex + 1, this.plans.length - this.visibleCards)
    : Math.max(0, this.currentSlideIndex - 1);
}




}
