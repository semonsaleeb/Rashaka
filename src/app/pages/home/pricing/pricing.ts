import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingService } from '../../../services/pricing.service';
import { SucesStory } from '../suces-story/suces-story';
import { ActivatedRoute, Router } from '@angular/router';
import { Plan } from '../../../../models/plan.model';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, SucesStory],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.scss']
})
export class Pricing implements OnInit, AfterViewInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';
  selectedPlan: string = 'sessions';
  plans: Plan[] = [];                     // <-- استخدم Plan[]
  groupedPlans: Plan[][] = [];            // <-- مصفوفة مصفوفات Plans
  isLoading = false;
  currentSlideIndex = 0;
  cardsPerSlide = 3;
  activeSubscription: any = null;
  subscribedPlanId: number | null = null;
  isPopupExpanded = false;

  @ViewChild('carouselInner') carouselInner!: ElementRef;

  constructor(
    private pricingService: PricingService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

ngOnInit() {
  this.route.queryParams.subscribe(params => {
    const openPopup = params['openPopup'] === 'true';
    const pkgId = Number(params['id']);

    this.loadPackages(pkgId, openPopup);
  });
}

loadPackages(pkgId?: number, openPopup?: boolean): void {
  this.isLoading = true;
  this.pricingService.getPackages(this.selectedPlan).subscribe({
    next: res => {
      this.plans = res.packages.map((pkg: any, index: number): Plan => ({
        id: pkg.id,
        type: pkg.type,
        title: pkg.name,
        price: pkg.price_after || pkg.price_before,
        sessions: pkg.features.length,
        cities: this.formatCities(pkg.cities),
        features: pkg.features.map((f: any) => f.text_ar),
        styleType: ['basic', 'premium', 'standard'][index % 3] as 'basic' | 'premium' | 'standard'
      }));

      this.groupedPlans = this.chunkArray(this.plans, this.cardsPerSlide);
      this.currentSlideIndex = 0;
      this.isLoading = false;

      if (openPopup && pkgId) {
        const pkg = this.plans.find(p => p.id === pkgId);
        if (pkg) {
          this.openPopup(pkg);
        }
      }

      setTimeout(() => this.scrollToCurrentSlide(), 100);
    },
    error: err => {
      console.error('Failed to load packages', err);
      this.isLoading = false;
    }
  });
}


  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToCurrentSlide(), 100);
  }

 
  private chunkArray(arr: Plan[], size: number): Plan[][] {
    const result: Plan[][] = [];
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

  // subscribe(planId: number): void {
  //   this.pricingService.subscribeToPackage(planId).subscribe({
  //     next: () => {
  //       this.subscribedPlanId = planId;
  //       console.log('تم الاشتراك في الباقة:', planId);
  //       alert('تم الاشتراك بنجاح');
  //       this.router.navigate(['/orders']);
  //     },
  //     error: () => alert('حدث خطأ أثناء الاشتراك')
  //   });
  // }

  formatCities(cities: any[]): string {
    if (!cities || cities.length === 0) return 'كل المدن';
    return cities.map(city => city.name_ar || city.name).join('، ');
  }

  @ViewChild('carouselTrack', { static: false }) carouselTrack!: ElementRef;
  visibleCards: number = 3;

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

  selectedPlanForPopup: Plan | null = null; // <-- بدل any بـ Plan
  showPopup: boolean = false;

  openPopup(plan: Plan) {
    this.selectedPlanForPopup = plan;
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
    this.selectedPlanForPopup = null;
  }

  confirmSubscription() {
    if (!this.selectedPlanForPopup) return;

    this.pricingService.subscribeToPackageFromWeb(
      this.selectedPlanForPopup.id,
      'cash',
      true
    ).subscribe({
      next: (res) => {
        console.log('تم الاشتراك بنجاح', res);
        this.showPopup = false;
      },
      error: (err) => {
        console.error('خطأ في الاشتراك', err);
      }
    });
  }

  selectedPackage: string | null = null;

  selectPackage(pkgId: string) {
    this.selectedPackage = pkgId;
  }
  
  closePackage() {
    this.selectedPackage = null;
  }

  goToOrder(pkg: Plan) { // <-- النوع Plan
    this.router.navigate(['/package-pricing-order'], {
      queryParams: { openPopup: 'true', id: pkg.id }
    });
  }
}
