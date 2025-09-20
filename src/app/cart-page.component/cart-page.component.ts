import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { CartStateService } from '../services/cart-state-service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PromoResponse as ServicePromoResponse } from '../../models/PromoResponse';
import { CartItem } from '../../models/CartItem';
import { CartResponse } from '../../models/CartResponse';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';


@Component({
  selector: 'app-cart-page.component',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss']
})
export class CartPageComponent implements OnInit {
  // ================== Variables ==================
  progressValue = 80;
 currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

  cartItems: CartItem[] = [];
  shippingFee: number = 30;

  /** إجمالي قبل الخصم (سعر الوحدة الأصلي * الكمية) */
  totalPrice: number = 0;

  /** إجمالي بعد الخصم (لو في sale_unit_price يُستخدم، وإلا السعر الأصلي) */
  totalSalePrice: number = 0;

  /** المخصوم = totalPrice - totalSalePrice */
  discountAmount: number = 0;

  addressId: number = 1;
  paymentMethod: string = 'cash';
  promoCode: string = '';
  token: string = '';
  isLoading = false;

  // popup flag
  showLoginPopup = false;

  // ================== Constructor ==================
  constructor(
    private cartService: CartService,
    private cartState: CartStateService,
    private http: HttpClient,
    private router: Router,
    private translate: TranslateService, private languageService: LanguageService
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  // ================== Init ==================
  ngOnInit(): void {
    console.log('🟢 CartPageComponent INIT, token:', this.token);
    this.loadCart();

     this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  // ================== Helpers ==================
 private toNumber(value: any): number {
  if (typeof value === 'string') {
    value = value.replace(/,/g, ''); // 🟢 شيل الفواصل
  }
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // ================== Load Cart ==================
loadCart() {
  if (this.token) {
    // ✅ Logged-in user → call backend API
    this.cartService.getCart().subscribe({
      next: (response) => {
        const data: CartResponse = response?.data || {
          items: [],
          cart_total: 0,
          sale_cart_total: 0,
          discountAmount: 0,
          totalQuantity: 0
        };

        console.log("🟢 API CartResponse:", data); // <── هنا هتشوف كل الداتا من الـ API

        this.processCartItems(data); 
      },
      error: (err) => console.error('❌ Error loading cart:', err)
    });
  } else {
    // 👤 Guest user → use localStorage
    const data = this.cartService.getGuestCart();

    console.log("👤 Guest Cart (from localStorage):", data); // <── هنا هتشوف بيانات الضيف

    this.processCartItems(data);
  }
}


  /**
   * 🧮 دلوقتي هنستخدم القيم من الـ API مباشرة
   */
  // private processCartItems(data: CartResponse) {
  //   const items = Array.isArray(data.items) ? data.items : [];

  //   this.cartItems = items.map((item) => ({
  //     ...item,
  //     nameAr: item.product_name_ar || 'منتج بدون اسم',
  //   }));

  //   // ناخد القيم مباشرة من الـ backend
  //   this.totalPrice = this.round2(this.toNumber(data.cart_total));
  //   this.totalSalePrice = this.round2(this.toNumber(data.sale_cart_total));
  //   // this.discountAmount = this.round2(this.toNumber(data.discountAmount));

  //   // progress (مثال)
  //   this.progressValue = Math.min((this.totalSalePrice / 1000) * 100, 100);

  //   console.log('📊 Totals (from API):', {
  //     totalPrice: this.totalPrice,
  //     totalSalePrice: this.totalSalePrice,
  //     discountAmount: this.discountAmount
  //   });
  // }

  isLoggedIn(): boolean {
  return !!this.token; // أو لو بتخزن التوكين في service/localStorage
}

private processCartItems(data: CartResponse) {
  const items = Array.isArray(data.items) ? data.items : [];

  console.log("🟢 Raw items from API/localStorage:", items);

  this.cartItems = items.map((item) => {
    console.log("📦 Single item before mapping:", item);

    return {
      ...item,
      nameAr: item.product_name_ar || 'منتج بدون اسم',
      image: item.images?.[0] || '',
      // أسعار موحدة من الـ API
      unitPrice: this.toNumber(item.unit_price),
      saleUnitPrice: this.toNumber(item.sale_unit_price),
      totalPrice: this.toNumber(item.total_price),
      totalPriceAfterOffers: this.toNumber(item.total_price_after_offers),
    };
  });

  console.log("✅ Mapped cartItems:", this.cartItems);

  // ناخد الإجماليات من الـ backend زي ما هي
  this.totalPrice = this.round2(this.toNumber(data.cart_total));
  this.totalSalePrice = this.round2(this.toNumber(data.sale_cart_total));
  this.discountAmount = this.round2(this.toNumber(data.discount_value));

  this.progressValue = Math.min((this.totalSalePrice / 1000) * 100, 100);

  console.log('📊 Totals (from API):', {
    totalPrice: this.totalPrice,
    totalSalePrice: this.totalSalePrice,
    discountAmount: this.discountAmount
  });
}



  private handleCartResponse(data: CartResponse) {
    // احتفظنا بالدالة لو بتستخدم في أماكن تانية، بس loadCart هو المصدر الحقيقي للحسابات
    const items: CartItem[] = Array.isArray(data.items) ? data.items : [];
    this.cartItems = items;
    // يفضل عدم استخدام data.totalPrice هنا والاكتفاء بـ loadCart لحساب دقيق
  }

  // ================== Cart Operations ==================
  increaseQuantity(productId: number) {
    if (this.token) {
      this.cartService.addToCart(productId, 1).subscribe({
        next: () => this.loadCartAndUpdateState() // ⬅️ تعديل هنا
      });
    } else {
      const item = this.cartItems.find(i => i.product_id === productId);
      if (item) {
        item.quantity += 1;
        this.cartService.updateGuestQuantity(productId, item.quantity);
        this.loadCartAndUpdateState(); // ⬅️ هنا أيضاً
      }
    }
  }

  decreaseQuantity(productId: number) {
    if (this.token) {
      this.cartService.reduceCartItem(productId).subscribe({
        next: () => this.loadCartAndUpdateState()
      });
    } else {
      const item = this.cartItems.find(i => i.product_id === productId);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        this.cartService.updateGuestQuantity(productId, item.quantity);
        this.loadCartAndUpdateState();
      }
    }
  }

  removeItem(productId: number) {
    if (this.token) {
      this.cartService.removeCartItem(productId).subscribe({
        next: () => this.loadCartAndUpdateState()
      });
    } else {
      this.cartService.removeGuestItem(productId);
      this.loadCartAndUpdateState();
    }
  }
  private loadCartAndUpdateState() {
    if (this.token) {
      this.cartService.getCart().subscribe({
        next: (res) => {
          const data: CartResponse = res.data || {
            items: [],
            cart_total: 0,
            sale_cart_total: 0,
            totalQuantity: 0
          };

          this.processCartItems(data); // ✅ pass full object
          this.cartState.updateItems(data.items);
        },
        error: () => {
          this.cartItems = [];
          this.cartState.updateItems([]);
        }
      });
    } else {
      const data = this.cartService.getGuestCart();
      this.processCartItems(data);             // ✅ also pass full object
      this.cartState.updateItems(data.items);  // not just array
    }
  }



  // ================== Getters ==================
  get totalCartItemsCount(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  hasDiscount(): boolean {
    return this.discountAmount > 0;
  }

  trackByFn(index: number, item: CartItem): number {
    return item.product_id ?? index;
  }

  // ================== Place Order ==================
  placeOrder() {
    if (!this.token) {
      // احفظ الصفحة الحالية للعودة لها بعد تسجيل الدخول
      localStorage.setItem('redirectAfterLogin', this.router.url);

      // عرض popup تسجيل الدخول
      this.showLoginPopup = true;
      return;
    }

    // المستخدم مسجل دخول → اذهب لصفحة الطلب
    this.router.navigate(['/placeOrder']);
  }


  // ================== Promo ==================
  applyPromoCode() {
    if (!this.promoCode || this.promoCode.trim() === '') {
      alert('أدخل كود الخصم أولًا');
      return;
    }

    // ابعتي الإجمالي قبل الخصم (الأصلي)
    const currentTotalToSend = this.totalPrice || this.totalSalePrice || 0;

    this.cartService.applyPromocode(this.promoCode, currentTotalToSend).subscribe({
      next: (res: ServicePromoResponse) => {
        if (res.success) {
          const original = this.toNumber(res.original_total);
          const afterPromo = this.toNumber(res.new_total);

          this.totalPrice = this.round2(original);
          this.totalSalePrice = this.round2(afterPromo);
          this.discountAmount = this.round2(this.totalPrice - this.totalSalePrice);

          alert(`تم تطبيق الكود: ${res.promocode} - خصم ${res.discount_amount}`);
        } else {
          alert('رمز الخصم غير صالح');
        }
      },
      error: (err) => {
        console.error('Promo error:', err);
        alert('حدث خطأ أثناء تطبيق الكود');
      }
    });
  }

  // ================== Popup Actions ==================
  goToLogin() {
    this.showLoginPopup = false;
    localStorage.setItem('redirectAfterLogin', this.router.url);
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.showLoginPopup = false;
    this.router.navigate(['/auth/register']);
  }

  closePopup() {
    this.showLoginPopup = false;
  }

  
}