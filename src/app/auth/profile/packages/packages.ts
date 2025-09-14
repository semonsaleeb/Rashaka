import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PricingService } from '../../../services/pricing.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { ActiveSubscription, PackageFeature } from '../../../../models/activeSubscription';
import { ProductService } from '../../../services/product';



@Component({
  selector: 'app-packages',
  imports: [CommonModule, TranslateModule],
  templateUrl: './packages.html',
  styleUrls: ['./packages.scss']
})
export class Packages implements OnInit {
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';
  freeProductBalance: number = 0; 
  token: string = '';
  isLoggedIn: boolean = false;

  activeSubscription: ActiveSubscription | null = null;
  isLoading = true;

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService,
    private router: Router,
    private pricingService: PricingService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.loadActiveSubscription();

    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  this.token = localStorage.getItem('token') || '';
    this.isLoggedIn = !!this.token;


     this.productService.getFreeProductBalance(this.token).subscribe({
        next: (res) => {
          console.log('Remaining Free Product Balance:', res.data.balance.remaining);
          // ممكن تخزنه في متغير في الكومبوننت لو هتستخدمه في الـ HTML
          this.freeProductBalance = res.data.balance.remaining;
        },
        error: (err) => {
          console.error('❌ Error fetching free product balance:', err);
        }
      });

  
    
  }

  loadActiveSubscription(): void {
    this.isLoading = true;
    console.log('📡 Fetching active package...');

    this.pricingService.getActivePackage().subscribe({
      next: (res) => {
        console.log('✅ API Response:', res);
        this.isLoading = false;

      if (['active', 'pending_activation', 'expired'].includes(res.state)) {
  this.activeSubscription = {
    id: res.package?.id || 0,
    name: res.package?.name || '',
    start_date: res.package?.start_date || '',
    end_date: res.package?.end_date || null,
    status: res.state,
    type: res.package?.type || '',          // ✅ صح
    activation_code: res.activation_code || null,
    features: res.package?.features?.map((f: PackageFeature) => ({
      type: f.type,
      total: f.total,
      used: f.used ?? 0,
      remaining: f.remaining ?? 0
    })) || []
  };
}
 else {
          console.warn('⚠️ No active subscription found, state:', res.state);
          this.activeSubscription = null;
        }
      },
      error: (err) => {
        console.error('❌ Error fetching active package:', err);
        this.isLoading = false;
        this.activeSubscription = null;
      }
    });
  }

  goToPackages() {
    this.router.navigate(['/home/packages']);
  }

  visitBranch() {
    this.router.navigate(['/home/branches']);
  }
}
