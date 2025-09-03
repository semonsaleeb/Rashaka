import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PricingService } from '../../../services/pricing.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-packages',
  imports: [CommonModule],
  templateUrl: './packages.html',
  styleUrl: './packages.scss'
})
export class Packages  implements OnInit {
  activeSubscription: {
    name: string;
    status: string;
    activation_code: string | null;
    features: string[];
  } | null = null;

  isLoading = true;

  constructor(private router: Router, private pricingService: PricingService) { }

  ngOnInit(): void {
    this.loadActiveSubscription();
  }

  loadActiveSubscription(): void {
    this.isLoading = true;
    console.log('📡 Fetching active package...');

    this.pricingService.getActivePackage().subscribe({
      next: (res) => {
        console.log('✅ API Response:', res); // نشوف البيانات الراجعة من السيرفر
        this.isLoading = false;

        if (['active', 'pending_activation', 'expired'].includes(res.state)) {
          this.activeSubscription = {
            name: res.package?.name || '',
            status: res.state,
            activation_code: res.activation_code || null,
            features: res.package?.features?.map((f: { type: string; total: number }) => {
              console.log('🔹 Feature:', f); // نشوف كل ميزة
              return `${f.type} - ${f.total} مرات`;
            }) || []
          };
          console.log('📦 Active Subscription Set:', this.activeSubscription);
        } else {
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
