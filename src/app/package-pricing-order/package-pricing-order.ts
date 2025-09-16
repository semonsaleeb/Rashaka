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
      if (this.paymentMethod === 'credit_card') {
        // حساب المبلغ الكلي (ممكن تضيف رسوم إضافية زي الشحن لو عندك)
        const totalAmount = Number(this.totalPrice);

        if (isNaN(totalAmount) || totalAmount <= 0) {
          console.error('المبلغ الكلي غير صالح');
          alert('خطأ في حساب المبلغ الكلي');
          this.isLoading = false;
          return;
        }

        // إعداد بيانات الدفع
        const paymentData = {
          CustomerName: this.user?.name || 'عميل جديد',
          CustomerEmail: this.user?.email || 'guest@example.com',
          CustomerMobile: this.user?.phone || '966000000000',
          NotificationOption: 'Lnk',
          InvoiceValue: this.totalPrice,
          CallBackUrl: `${window.location.origin}/payment-success?packageId=${this.selectedPackage.id}`,
          ErrorUrl: `${window.location.origin}/payment-failure?packageId=${this.selectedPackage.id}`,
          Language: 'AR',
          DisplayCurrencyIso: 'SAR',
          CustomerReference: this.selectedPackage.id
        };

        console.log('📦 بيانات الدفع المرسلة:', paymentData);

        this.paymentService.initiatePayment(paymentData).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            console.log('💳 استجابة ماي فاتورة:', res);

            if (res?.IsSuccess && res?.Data?.InvoiceURL) {
              // تخزين بيانات الدفع pending
              localStorage.setItem(
                'pendingPayment',
                JSON.stringify({
                  packageId: this.selectedPackage?.id,
                  paymentId: res.Data.InvoiceId
                })
              );

              // تحويل المستخدم لصفحة الدفع
              window.location.href = res.Data.InvoiceURL;
            } else {
              const errorMsg = res?.Message || 'تعذر إنشاء رابط الدفع';
              console.error('❌ فشل في إنشاء الفاتورة:', errorMsg);
              alert(errorMsg);
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('⚠️ خطأ في خدمة الدفع:', err);
            alert('حدث خطأ أثناء إنشاء الدفع');
          }
        });

      } else {
        // الدفع كاش
        this.pricingService
          .subscribeToPackageFromWeb(this.selectedPackage.id, this.paymentMethod, false)
          .subscribe({
            next: (res: any) => {
              this.isLoading = false;
              console.log('✅ Subscription API Response:', res);

              if (res.status === 'success') {
                this.subscriptionData = {
                  name: this.selectedPackage?.title,
                  sessions: this.selectedPackage?.sessions,
                  activation_code:
                    res.subscription?.activation_code || res.activation_code || null
                };
                this.showPopup = true;
              } else {
                alert('حدث خطأ أثناء الاشتراك: ' + (res.message || 'Unknown error'));
              }
            },
            error: (err) => {
              this.isLoading = false;
              console.error('❌ Subscription API Error:', err);
              alert('حدث خطأ أثناء الاشتراك');
            }
          });
      }
    } catch (e) {
      this.isLoading = false;
      console.error('خطأ غير متوقع في confirmSubscription:', e);
      alert('حدث خطأ غير متوقع أثناء معالجة الاشتراك');
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
