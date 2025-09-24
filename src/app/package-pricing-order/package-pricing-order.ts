import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService } from '../services/pricing.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Plan } from '../../models/plan.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { PaymentService } from '../services/payment.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-package-pricing-order',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './package-pricing-order.html',
  styleUrls: ['./package-pricing-order.scss']
})
export class PackagePricingOrder implements OnInit {
  packages: Plan[] = [];
  selectedPackage: Plan | null = null;
  discountCode = '';
  discountApplied = false;
  discountAmount = 0;
  // agreeToTerms = false;
  isLoading = false;
  paymentMethod = 'cash';
  promoCode = '';
  currentLang: string = 'ar';
  user: any = null;
  subscriptionData: any = null;
  showPopup = false;

  constructor(
    private pricingService: PricingService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private languageService: LanguageService,
    private paymentService: PaymentService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {

    this.user = JSON.parse(localStorage.getItem('client') || 'null');
    this.route.queryParams.subscribe(params => {
      const pkgId: number | undefined = params['id'] ? Number(params['id']) : undefined;
      const openDirectly: boolean = params['openPopup'] === 'true';
      this.loadPackages(pkgId, openDirectly);
    });



    this.translate.use(this.languageService.getCurrentLanguage());

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.translate.use(lang);
    });

    this.currentLang = this.languageService.getCurrentLanguage();

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });



  }

  loadPackages(pkgId?: number, openDirectly?: boolean): void {
    this.isLoading = true;

    this.pricingService.getAllPackages().subscribe({
      next: (res) => {
        if (!res || !res.packages) {
          this.packages = [];
          this.isLoading = false;
          return;
        }

        const allPackages: Plan[] = res.packages.map((pkg: any, index: number): Plan => ({
          id: pkg.id,
          type: pkg.type,
          title: pkg.name,
          price_before: Number(pkg.price_before),
          price_after: Number(pkg.price_after) || 0,
          sessions: pkg.duration,
          cities: Array.isArray(pkg.cities) ? pkg.cities.map((c: any) => ({
            name: c.name,
            name_ar: c.name_ar
          })) : [],
          features: pkg.features.map((f: any) => ({
            type: f.type,
            text_ar: f.text_ar,
            text_en: f.text_en
          })),
          styleType: ['basic', 'premium', 'standard'][index % 3] as 'basic' | 'premium' | 'standard',
          active_offer: pkg.active_offer ? {
            id: pkg.active_offer.id,
            discount_type: pkg.active_offer.discount_type,
            discount_value: pkg.active_offer.discount_value,
            start_date: pkg.active_offer.start_date,
            end_date: pkg.active_offer.end_date
          } : undefined
        }));

        this.packages = pkgId ? allPackages.filter(p => p.id === pkgId) : allPackages;

        if (openDirectly && pkgId && this.packages.length > 0) {
          this.selectPackage(this.packages[0]);
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }


  formatCities(cities: any[]): string {
    if (!cities || cities.length === 0) return 'كل المدن';
    return cities.map(city => city.name_ar || city.name).join('، ');
  }

  selectPackage(pkg: Plan) {
    this.selectedPackage = pkg;
    this.discountCode = '';
    this.discountApplied = false;
    this.discountAmount = 0;
    // this.agreeToTerms = false;

  }

  applyDiscount(): void {
    if (!this.discountCode || !this.selectedPackage) return;

    // Ensure prices are numbers
    const priceBefore = Number(this.selectedPackage.price_before);
    const priceAfter = Number(this.selectedPackage.price_after);

    // Example: 10% discount on price_after
    this.discountAmount = priceAfter * 0.1;
    this.discountApplied = true;

    console.log('Price Before:', priceBefore, 'Price After:', priceAfter, 'Discount:', this.discountAmount);
  }

  // Total price after discount
get totalPrice(): number {
  if (!this.selectedPackage) return 0;

  const priceAfter = Number(this.selectedPackage.price_after || 0);
  const priceBefore = Number(this.selectedPackage.price_before || 0);

  // لو price_after بصفر هرجع السعر قبل الخصم
  const basePrice = priceAfter > 0 ? priceAfter : priceBefore;

  return basePrice - (this.discountApplied ? this.discountAmount : 0);
}


confirmSubscription(): void {
  if (!this.selectedPackage) return;

  try {
    this.isLoading = true;

    console.log('✅ selectedPackage:', this.selectedPackage);
    console.log('✅ totalPrice:', this.totalPrice, typeof this.totalPrice);

    // Use backend API for both payment methods
    this.pricingService
      .subscribeToPackageFromWeb(
        this.selectedPackage.id, 
        this.paymentMethod, 
        false
      )
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('📦 استجابة السيرفر من subscribeToPackageFromWeb:', res);

          // Handle different response scenarios based on API guide
          if (res.status === 'success') {
            // ✅ Payment completed successfully (cash/zero-total or already paid card)
            this.handleSuccessfulSubscription(res);
            
          } else if (res.status === 'requires_payment_action') {
            // 🔵 Card payment required - redirect to payment URL
            this.handleCreditCardSubscription(res);
            
          } else if (res.status === 'error') {
            // ❌ Error case
            alert(res.message || 'حدث خطأ أثناء إنشاء الاشتراك');
          } else {
            // Unexpected response
            console.error('استجابة غير متوقعة:', res);
            alert('استجابة غير متوقعة من الخادم');
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('❌ خطأ في خدمة الاشتراك:', err);
          this.handleSubscriptionError(err);
        }
      });

  } catch (e) {
    this.isLoading = false;
    console.error('خطأ غير متوقع في confirmSubscription:', e);
    alert('حدث خطأ غير متوقع أثناء معالجة الاشتراك');
  }
}

private handleSuccessfulSubscription(res: any): void {
  // ✅ Subscription completed successfully
  this.subscriptionData = {
    name: this.selectedPackage?.title,
    sessions: this.selectedPackage?.sessions,
    activation_code: res.data?.activation_code || res.subscription?.activation_code || null
  };
  this.showPopup = true;
  
  console.log('✅ الاشتراك مكتمل بنجاح:', res);
}

private handleCreditCardSubscription(res: any): void {
  try {
    if (res.data?.payment_url) {
      // Store pending payment info
      localStorage.setItem(
        'pendingPayment',
        JSON.stringify({ 
          packageId: this.selectedPackage?.id,
          orderId: res.data.order_id,
          invoiceId: res.data.invoice_id 
        })
      );

      // Redirect to MyFatoorah payment page (URL comes from backend)
      console.log('Redirecting to payment URL:', res.data.payment_url);
      window.location.href = res.data.payment_url;
    } else {
      console.error('No payment URL provided');
      alert('خطأ في رابط الدفع');
    }
  } catch (e) {
    console.error('خطأ غير متوقع في معالجة الدفع:', e);
    alert('حدث خطأ غير متوقع أثناء معالجة الدفع');
  }
}

private handleSubscriptionError(err: any): void {
  // Handle specific error cases based on API guide
  if (err.status === 422) {
    alert('خطأ في البيانات المرسلة');
  } else if (err.status === 402) {
    alert('فشل في عملية الدفع، يرجى المحاولة مرة أخرى');
  } else if (err.status === 409) {
    alert('لديك عملية دفع معلقة. يرجى إكمالها أولاً');
  } else {
    alert('حدث خطأ أثناء الاشتراك: ' + (err.message || 'Unknown error'));
  }
}

  closePopup() {
    this.showPopup = false;
  }

  goToBranches() {
    this.router.navigate(['/home/branches']);
    this.showPopup = false;
  }
}
