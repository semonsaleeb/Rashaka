import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-failed',
  templateUrl: './payment-failed.html',
  styleUrls: ['./payment-failed.scss']
})
export class PaymentFailed implements OnInit {
  errorMessage: string = 'فشل عملية الدفع';
  orderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'] || null;
      this.errorMessage = params['error'] || 'فشل عملية الدفع';
    });

    // تنظيف pending payment في حالة الفشل
    localStorage.removeItem('pendingPayment');
  }

  retryPayment() {
    if (this.orderId) {
      this.router.navigate(['/checkout'], {
        queryParams: { orderId: this.orderId }
      });
    } else {
      this.router.navigate(['/checkout']);
    }
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}