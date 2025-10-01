import { Component, Input, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingService } from '../../../services/pricing.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {  City, Feature, Plan } from '../../../../models/plan.model';
import { AuthService } from '../../../services/auth.service';
import { Downloadapp } from '../downloadapp/downloadapp';
import { SucesStory } from '../suces-story/suces-story';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { ClientOpinion } from "../client-opinion/client-opinion";

declare var bootstrap: any;

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, Downloadapp, ClientOpinion, TranslateModule, ClientOpinion],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.scss']
})
export class Pricing implements OnInit, AfterViewInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';
  lang: 'ar' | 'en' = 'ar'; // default Arabic



  selectedPlan: string = 'sessions';
  plans: Plan[] = [];
  isLoading = false;

  // Carousel state
  currentSlideIndex = 0;
  visibleCards = 3;         // بيتغير حسب الحجم
  touchStartX = 0;
  touchEndX = 0;
  private readonly SWIPE_THRESHOLD = 50;

  // Auth/subscribe state
  activeSubscription: any = null;
  subscribedPlanId: number | null = null;
  isLoggedIn = false;

  currentLang: string = 'ar';

  // Popups
  selectedPlanForPopup: Plan | null = null;
  showPopup = false;
  showLoginPopup = false;
  showSubscribePopup = false;
  isPopupExpanded = false;

  // Expand per-card
  expandedPlans: number[] = [];

  constructor(
    private pricingService: PricingService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private translate: TranslateService,
    private languageService: LanguageService
  ) { }

  // ngOnInit() {

  //   const midIndex = Math.floor(this.getMaxIndex() / 2); // المنتصف
  // this.currentSlideIndex = midIndex;
  //   // حالة تسجيل الدخول (مزامنة مستمرة)
  //   this.isLoggedIn = this.auth.isLoggedIn();
  //   this.auth.isLoggedIn$.subscribe(status => this.isLoggedIn = status);

  //   // استجابة للشاشة
  //   this.updateVisibleCards();

  //   // تحميل الباقات مع باراميتر اختيار باقة وفتح Popup
  //   this.route.queryParams.subscribe(params => {
  //     const openPopup = params['openPopup'] === 'true';
  //     const pkgId = Number(params['id']);
  //     this.loadPackages(pkgId, openPopup);
  //   });


  //   this.translate.use(this.languageService.getCurrentLanguage());

  //   // Listen for language changes
  //   this.languageService.currentLang$.subscribe(lang => {
  //     this.translate.use(lang);
  //   });

  //   this.currentLang = this.languageService.getCurrentLanguage();

  //   // Listen for language changes
  //   this.languageService.currentLang$.subscribe(lang => {
  //     this.currentLang = lang;
  //   });



  // }
  ngOnInit() {
  this.isLoggedIn = this.auth.isLoggedIn();
  this.auth.isLoggedIn$.subscribe(status => this.isLoggedIn = status);

  this.updateVisibleCards();

  // تحميل الباقات
  this.route.queryParams.subscribe(params => {
    const openPopup = params['openPopup'] === 'true';
    const pkgId = Number(params['id']);
    this.loadPackages(pkgId, openPopup);
  });

  // تحميل الاشتراك الحالي
  if (this.isLoggedIn) {
    this.loadUserSubscription();
  }
    this.languageService.currentLang$.subscribe(lang => {
  this.currentLang = lang;
  this.textDir = lang === 'ar' ? 'rtl' : 'ltr';
});
}

private setInitialIndex(): void {
  const midIndex = Math.floor(this.getMaxIndex() / 2);
  this.currentSlideIndex = midIndex;
}
  ngAfterViewInit(): void {
    // لا شيء هنا حاليًا، الاحتفاظ لو احتجنا future hooks
  }

  @HostListener('window:resize')
  onWindowResize() {
    const prevVisible = this.visibleCards;
    this.updateVisibleCards();
    if (this.visibleCards !== prevVisible) {
      this.clampIndex(); // تأكيد أن الـ index صالح بعد تغيير عدد الكروت
    }
  }

  // === UI helpers ===

  updateVisibleCards() {
    const w = window.innerWidth;
    if (w < 768) this.visibleCards = 1;         // موبايل
    else if (w < 1200) this.visibleCards = 2;   // تابلت
    else this.visibleCards = 3;                 // ديسكتوب
    this.clampIndex();
  }
getActiveIndex(i: number): boolean {
  return i >= this.currentSlideIndex && i < this.currentSlideIndex + this.visibleCards;
}




private clampIndex() {
  const maxIndex = this.getMaxIndex();
  
  // تأكد من أن الفهرس لا يقل عن 0 ولا يزيد عن الحد الأقصى
  if (this.currentSlideIndex < 0) {
    this.currentSlideIndex = 0;
  } else if (this.currentSlideIndex > maxIndex) {
    this.currentSlideIndex = maxIndex;
  }
}

public getMaxIndex(): number {
  if (!this.plans || this.plans.length === 0) return 0;
  
  if (this.visibleCards === 1) {
    return this.plans.length - 1;
  } else {
    return Math.max(0, this.plans.length - this.visibleCards);
  }
}



getDotsArray(): number[] {
  if (!this.plans || this.plans.length === 0) return [];

  if (this.visibleCards === 1) {
    // Mobile: كل كارت نقطة
    return Array.from({ length: this.plans.length }, (_, i) => i);
  } else {
    // Desktop/Tablet: كل slide نقطة
    // عدد الـ slides = ceil(totalCards / visibleCards)
    const totalSlides = Math.ceil(this.plans.length / this.visibleCards);
    return Array.from({ length: totalSlides }, (_, i) => i);
  }
}


goToSlide(i: number): void {
  const maxIndex = this.getMaxIndex();
  if (this.currentLang === 'ar') {
    // بالعربي: نحسب من النهاية
    const targetIndex = maxIndex - i * this.visibleCards;
    this.currentSlideIndex = Math.max(0, targetIndex);
  } else {
    // بالإنجليزي: كما هو
    const targetIndex = i * this.visibleCards;
    this.currentSlideIndex = Math.min(targetIndex, maxIndex);
  }
}




  // الأسهم (متوافقة مع الأزرار في القالب)
scrollLeft(): void {
  if (this.visibleCards === 1) {
    if (this.currentLang === 'ar') this.currentSlideIndex--;
    else this.currentSlideIndex--;
  }
  this.clampIndex();
}

scrollRight(): void {
  if (this.visibleCards === 1) {
    if (this.currentLang === 'ar') this.currentSlideIndex++;
    else this.currentSlideIndex++;
  }
  this.clampIndex();
}




  // === Data ===

loadPackages(pkgId?: number, openPopup?: boolean): void {
  this.isLoading = true;

  this.pricingService.getPackages(this.selectedPlan).subscribe({
    next: res => {
      this.plans = res.packages.map((pkg: any, index: number): Plan => {
        // Features
        const features: Feature[] = pkg.features.map((f: any) => ({
          type: f.type,
          text_ar: f.text_ar,
          text_en: f.text_en
        }));

        // Cities
        const cities: City[] = pkg.cities.map((c: any) => ({
          name: c.name,
          name_ar: c.name_ar
        }));

        // Active offer (optional)
        const active_offer = pkg.active_offer
          ? {
              id: pkg.active_offer.id,
              discount_type: pkg.active_offer.discount_type,
              discount_value: pkg.active_offer.discount_value,
              start_date: pkg.active_offer.start_date,
              end_date: pkg.active_offer.end_date
            }
          : undefined;

        return {
          id: pkg.id,
          type: pkg.type,
          title: pkg.name,
          price_after: pkg.price_after,
          price_before: pkg.price_before,
          sessions: pkg.duration,
          cities,
          features,
          styleType: (
            ['basic', 'premium', 'standard'][index % 3] as
              | 'basic'
              | 'premium'
              | 'standard'
          ),
          active_offer
        };
      });

      // === اختيار السلايد الابتدائي ===
      if (pkgId) {
        // أولوية: لو جاي id من الرابط → نروحله
        const foundIndex = this.plans.findIndex(p => p.id === pkgId);
        this.currentSlideIndex = foundIndex !== -1 ? foundIndex : 0;
      } else {
        // مفيش id → حسب نوع الجهاز
        if (this.visibleCards === 1) {
          // موبايل → يبدأ من النص
          this.currentSlideIndex = Math.floor(this.getMaxIndex() / 2);
        } else {
          // تابلت/ديسكتوب → يبدأ من أول كارت
          this.currentSlideIndex = 0;
        }
      }

      this.clampIndex();
      this.isLoading = false;

      // فتح البوب أب لو مطلوب
      if (openPopup && pkgId) {
        const pkg = this.plans.find(p => p.id === pkgId);
        if (pkg) this.openPopup(pkg);
      }
    },
    error: err => {
      console.error('Failed to load packages', err);
      this.isLoading = false;
    }
  });
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
getCitiesText(cities: City[]): string {
  if (!cities || cities.length === 0) return this.currentLang === 'ar' ? 'كل المدن' : 'All Cities';
  return cities.map(c => this.currentLang === 'ar' ? c.name_ar : c.name).join(', ');
}


  // === Expand features ===

  toggleExpand(planId: number): void {
    const idx = this.expandedPlans.indexOf(planId);
    if (idx === -1) this.expandedPlans.push(planId);
    else this.expandedPlans.splice(idx, 1);
  }

  isExpanded(planId: number): boolean {
    return this.expandedPlans.includes(planId);
  }

  // === Subscribe / Auth ===

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
    this.pricingService
      .subscribeToPackageFromWeb(this.selectedPlanForPopup.id, 'cash', true)
      .subscribe({
        next: (res) => {
          // console.log('تم الاشتراك بنجاح', res);
          this.showPopup = false;
        },
        error: (err) => {
          // console.error('خطأ في الاشتراك', err);
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

  handleSubscribe(plan: Plan) {
    this.selectedPlanForPopup = plan;
    this.showPopup = true;
  }

  goToOrder(pkg: Plan) {
    this.router.navigate(['/package-pricing-order'], {
      queryParams: { openPopup: 'true', id: pkg.id }
    });
  }

  // === Login/Register popups ===

  onSubscribeClick(plan: any) {
    if (this.isLoggedIn) {
      this.openSubscribePopup(plan);
    } else {
      this.openLoginPopup();
    }
  }

  openLoginPopup() {
    this.showLoginPopup = true;
  }
  closeLoginPopup() {
    this.showLoginPopup = false;
  }

  openSubscribePopup(plan: any) {
    this.selectedPlanForPopup = plan;
    this.showSubscribePopup = true;
  }
  closeSubscribePopup() {
    this.showSubscribePopup = false;
    this.selectedPlanForPopup = null;
    this.isPopupExpanded = false;
  }

  // === Touch (Swipe) ===

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

scrollNext() {
  if (this.currentLang === 'ar') {
    // في العربية، التحريك للأمام = طرح الكاردز
    this.currentSlideIndex -= this.visibleCards;
  } else {
    this.currentSlideIndex += this.visibleCards;
  }
  this.clampIndex();
}

scrollPrev() {
  if (this.currentLang === 'ar') {
    // في العربية، التحريك للخلف = زيادة الكاردز
    this.currentSlideIndex += this.visibleCards;
  } else {
    this.currentSlideIndex -= this.visibleCards;
  }
  this.clampIndex();
}

get displayPlans(): Plan[] {
  // لو عربي → نعرض الباقات بالعكس
  return this.currentLang === 'en' ? [...this.plans].reverse() : this.plans;
}




private handleSwipe(): void {
  let swipeDistance = this.touchEndX - this.touchStartX;

  if (Math.abs(swipeDistance) > this.SWIPE_THRESHOLD) {
    if (swipeDistance > 0) {
      this.scrollPrev(); // سوايب يمين → يرجع لورا
    } else {
      this.scrollNext(); // سوايب شمال → يكمل لقدام
    }
  }
}



private loadUserSubscription(): void {
  if (!this.isLoggedIn) return;

  this.pricingService.getUserSubscription().subscribe({
    next: (res) => {
      this.activeSubscription = res.package;
      this.subscribedPlanId = res.package?.id ?? null;
      console.log('🎯 Active subscription:', this.subscribedPlanId);
    },
    error: (err) => {
      console.error('فشل تحميل الاشتراك الحالي', err);
      this.activeSubscription = null;
      this.subscribedPlanId = null;
    }
  });
}




  goToLogin() {
    this.showLoginPopup = false;
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.showLoginPopup = false;
    this.router.navigate(['/auth/register']);
  }
  // === Utils ===

  trackPlan(_index: number, plan: Plan) {
    return plan?.id ?? _index;
  }


textDir: 'rtl' | 'ltr' = 'rtl';
 nextSlide(): void {
  console.log('Next clicked - Current:', this.currentSlideIndex, 'Max:', this.getMaxIndex());
  const maxIndex = this.getMaxIndex();
  
  if (this.currentLang === 'ar') {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  } else {
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex++;
    }
  }
  console.log('After - Current:', this.currentSlideIndex);
  this.clampIndex();
}

prevSlide(): void {
  console.log('Prev clicked - Current:', this.currentSlideIndex, 'Max:', this.getMaxIndex());
  const maxIndex = this.getMaxIndex();
  
  if (this.currentLang === 'ar') {
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex++;
    }
  } else {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }
  console.log('After - Current:', this.currentSlideIndex);
  this.clampIndex();
}

isNextDisabled(): boolean {
  const maxIndex = this.getMaxIndex();
  
  if (this.currentLang === 'ar') {
    return this.currentSlideIndex <= 0;
  } else {
    return this.currentSlideIndex >= maxIndex;
  }
}

isPrevDisabled(): boolean {
  const maxIndex = this.getMaxIndex();
  
  if (this.currentLang === 'ar') {
    return this.currentSlideIndex >= maxIndex;
  } else {
    return this.currentSlideIndex <= 0;
  }
}
}
