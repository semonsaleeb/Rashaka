import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartStateService } from '../../services/cart-state-service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.scss']
})
export class PaymentSuccess implements OnInit {
  orderId: number | null = null;
  invoiceId: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartState: CartStateService
  ) {}

  ngOnInit() {
    // تنظيف الكارت بعد الدفع الناجح
    this.cartState.clearCart();
    localStorage.removeItem('cart');
    localStorage.removeItem('pendingPayment');

    // الحصول على بيانات الطلب من الURL أو الstate
    const nav = this.router.getCurrentNavigation();
    const stateData = nav?.extras.state?.['data'];
    
    if (stateData) {
      this.orderId = stateData.order_id;
      this.invoiceId = stateData.invoice_id;
    } else {
      // محاولة الحصول من الquery params
      this.route.queryParams.subscribe(params => {
        this.orderId = params['orderId'] || null;
        this.invoiceId = params['invoiceId'] || null;
      });
    }
  }

  goToOrders() {
    this.router.navigate(['/profile/orders']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}