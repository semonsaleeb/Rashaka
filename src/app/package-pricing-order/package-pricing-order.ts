import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService } from '../services/pricing.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Plan } from '../../models/plan.model';

@Component({
  selector: 'app-package-pricing-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './package-pricing-order.html',
  styleUrls: ['./package-pricing-order.scss']
})
export class PackagePricingOrder implements OnInit {
  packages: Plan[] = [];
  selectedPackage: Plan | null = null;
  discountCode = '';
  discountApplied = false;
  discountAmount = 0;
  agreeToTerms = false;
  isLoading = false;
  paymentMethod = 'cash';
  promoCode = '';

  subscriptionData: any = null;
  showPopup = false;

  constructor(
    private pricingService: PricingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pkgId: number | undefined = params['id'] ? Number(params['id']) : undefined;
      const openDirectly: boolean = params['openPopup'] === 'true';
      this.loadPackages(pkgId, openDirectly);
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
          price: pkg.price_after || pkg.price_before,
          sessions: pkg.features.length,
          cities: this.formatCities(pkg.cities),
          features: pkg.features.map((f: any) => f.text_ar),
          styleType: ['basic', 'premium', 'standard'][index % 3] as 'basic' | 'premium' | 'standard'
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
    this.agreeToTerms = false;
  }

  applyDiscount(): void {
    if (!this.discountCode || !this.selectedPackage) return;
    this.discountAmount = this.selectedPackage.price * 0.1;
    this.discountApplied = true;
  }

  get totalPrice(): number {
    if (!this.selectedPackage) return 0;
    return this.selectedPackage.price - this.discountAmount;
  }

confirmSubscription(): void {
  if (!this.agreeToTerms) {
    alert('يجب الموافقة على الشروط والأحكام أولاً');
    return;
  }
  if (!this.selectedPackage) return;

  this.isLoading = true;

  this.pricingService.subscribeToPackageFromWeb(
    this.selectedPackage.id,
    this.paymentMethod,
    false
  ).subscribe({
    next: (res: any) => {
      this.isLoading = false;

      // عرض الريسبونس بالكامل في console
      console.log('Subscription API Response:', res);

      if (res.status === 'success') {
        // لو الباكج أونلاين ويحتوي subscription
        if (res.subscription) {
          this.subscriptionData = {
            name: this.selectedPackage?.title,
            sessions: this.selectedPackage?.sessions,
            activation_code: res.subscription.activation_code || null
          };
        } 
        // لو الباكج offline ويحتوي activation_code
        else if (res.activation_code) {
          this.subscriptionData = {
            name: this.selectedPackage?.title,
            sessions: this.selectedPackage?.sessions,
            activation_code: res.activation_code
          };
        } 
        // fallback
        else {
          this.subscriptionData = {
            name: this.selectedPackage?.title,
            sessions: this.selectedPackage?.sessions,
            activation_code: null
          };
        }

        this.showPopup = true;
      } else {
        alert('حدث خطأ أثناء الاشتراك: ' + (res.message || 'Unknown error'));
      }
    },
    error: (err) => {
      this.isLoading = false;
      console.error('Subscription API Error:', err);
      alert('حدث خطأ أثناء الاشتراك');
    }
  });
}

  closePopup() {
    this.showPopup = false;
  }

  goToBranches() {
    this.router.navigate(['/home/branches']);
    this.showPopup = false;
  }
}
