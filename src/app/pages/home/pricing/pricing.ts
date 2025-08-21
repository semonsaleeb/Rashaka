import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingService } from '../../../services/pricing.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Plan } from '../../../../models/plan.model';
import { AuthService } from '../../../services/auth.service';
declare var bootstrap: any; 

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.scss']
})
export class Pricing implements OnInit, AfterViewInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';

  selectedPlan: string = 'nutrition';
  plans: Plan[] = [];
  groupedPlans: Plan[][] = [];
  isLoading = false;
  currentSlideIndex = 0;
  cardsPerSlide = 3;
  activeSubscription: any = null;
  subscribedPlanId: number | null = null;
  isPopupExpanded = false;
  visibleCards = 3;
  isLoggedIn: boolean = false;   // ✅ متغير حالة تسجيل الدخول

  @ViewChild('carouselInner') carouselInner!: ElementRef;
  @ViewChild('carouselTrack', { static: false }) carouselTrack!: ElementRef;

  constructor(
    private pricingService: PricingService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    // قراءة حالة تسجيل الدخول الحالية
    this.isLoggedIn = this.auth.isLoggedIn();
    // متابعة أي تغيير يحصل في الحالة
    this.auth.isLoggedIn$.subscribe(status => this.isLoggedIn = status);

    this.updateVisibleCards();
    window.addEventListener('resize', () => this.updateVisibleCards());

    this.route.queryParams.subscribe(params => {
      const openPopup = params['openPopup'] === 'true';
      const pkgId = Number(params['id']);
      this.loadPackages(pkgId, openPopup);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToCurrentSlide(), 100);
  }

  updateVisibleCards() {
    if (window.innerWidth < 768) {
      this.visibleCards = 1; // موبايل
    } else if (window.innerWidth < 1200) {
      this.visibleCards = 2; // تابلت
    } else {
      this.visibleCards = 3; // ديسكتوب
    }
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

  getDotsArray() {
    const total = Math.max(1, this.plans.length - this.visibleCards + 1);
    return Array(total).fill(0).map((_, i) => i);
  }

  changePlanType(type: string): void {
    this.selectedPlan = type;
    this.currentSlideIndex = 0;
    this.loadPackages();
  }

  formatCities(cities: any[]): string {
    if (!cities || cities.length === 0) return 'كل المدن';
    return cities.map(city => city.name_ar || city.name).join('، ');
  }

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

  selectedPlanForPopup: Plan | null = null;
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

  openAuthModal() {
    const modalElement = document.getElementById('authModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  selectedPackage: string | null = null;

  selectPackage(pkgId: string) {
    this.selectedPackage = pkgId;
  }
  
  closePackage() {
    this.selectedPackage = null;
  }

  goToOrder(pkg: Plan) {
    this.router.navigate(['/package-pricing-order'], {
      queryParams: { openPopup: 'true', id: pkg.id }
    });
  }

  handleSubscribe(plan: Plan) {
    if (!this.auth.isLoggedIn()) {
      const modal = new bootstrap.Modal(document.getElementById('authModal')!);
      modal.show();
    } else {
      this.openPopup(plan);
    }
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
    if (Math.abs(swipeDistance) > 50) { 
      if (swipeDistance > 0) {
        this.scrollLeft();
      } else {
        this.scrollRight();
      }
    }
  }

  showLoginPopup = false;

  goToLogin() {
    this.showLoginPopup = false;
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.showLoginPopup = false;
    this.router.navigate(['/auth/register']);
  }


  showSubscribePopup = false;


  // عند الضغط على زر الاشتراك
  onSubscribeClick(plan: any) {
    if (this.isLoggedIn) {
      this.openSubscribePopup(plan);
    } else {
      this.openLoginPopup();
    }
  }

  // فتح Popup تسجيل الدخول
  openLoginPopup() {
    this.showLoginPopup = true;
  }
  closeLoginPopup() {
    this.showLoginPopup = false;
  }

  // فتح Popup الاشتراك
  openSubscribePopup(plan: any) {
    this.selectedPlanForPopup = plan;
    this.showSubscribePopup = true;
  }
  closeSubscribePopup() {
    this.showSubscribePopup = false;
    this.selectedPlanForPopup = null;
    this.isPopupExpanded = false;
  }


}

