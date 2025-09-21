import { Component, OnInit, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order.service';
import { NgbCarousel, NgbCarouselModule, NgbSlideEvent } from '@ng-bootstrap/ng-bootstrap';
import { catchError, forkJoin, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, NgbCarouselModule, TranslateModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class Orders implements OnInit, OnDestroy {
  @ViewChild(NgbCarousel) carousel!: NgbCarousel;

  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';

  isLoading = true;
  errorMessage = '';
  groupedOrders: any[][] = [];
  allOrders: any[] = [];
  currentIndex = 0;
  visibleCards = 3;
  isMobile = false;

  orderStatuses: string[] = [];
  activeTab: string = '';

  private resizeListener!: () => void;

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.updateVisibleCards();

    // Add resize listener with debounce
    this.resizeListener = () => {
      clearTimeout((window as any).resizeTimer);
      (window as any).resizeTimer = setTimeout(() => {
        this.updateVisibleCards();
      }, 250);
    };
    window.addEventListener('resize', this.resizeListener);

    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  encodeUrl(url: string): string {
    return encodeURI(url);
  }

  updateVisibleCards(): void {
    const width = window.innerWidth;
    this.isMobile = width < 768;
    this.visibleCards = this.isMobile ? 1 : 3;

    if (this.allOrders.length > 0) {
      this.regroupOrders();
    }
  }

  regroupOrders(): void {
    const allOrdersFlat = this.allOrders;
    this.groupedOrders = [];
    for (let i = 0; i < allOrdersFlat.length; i += this.visibleCards) {
      this.groupedOrders.push(allOrdersFlat.slice(i, i + this.visibleCards));
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private touchStartX: number = 0;
  private touchEndX: number = 0;

  handleSwipe() {
    const minSwipeDistance = 50;
    if (this.touchStartX - this.touchEndX > minSwipeDistance) {
      this.nextSlide();
    } else if (this.touchEndX - this.touchStartX > minSwipeDistance) {
      this.prevSlide();
    }
  }

  loadOrders() {
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMessage = 'برجاء تسجيل الدخول لعرض الطلبات';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    this.orderService.getOrders(token).subscribe({
      next: (orders) => {
        if (!orders.length) {
          this.allOrders = [];
          this.groupedOrders = [];
          this.isLoading = false;
          return;
        }

        const requests = orders.map(order =>
          this.orderService.getOrderById(order.order_id, token).pipe(
            catchError(err => {
              console.warn(`⚠️ تخطي الطلب ${order.order_id}`, err.error?.message);
              return of(null);
            })
          )
        );

        forkJoin(requests).subscribe({
          next: (ordersWithDetails) => {
            const validOrders = ordersWithDetails.filter(o => o !== null);
            this.allOrders = validOrders;

            // استخراج status ديناميكي
            const statusesSet = new Set<string>();
            this.allOrders.forEach((order: any) => statusesSet.add(order.status));
            this.orderStatuses = Array.from(statusesSet);
            this.activeTab = this.orderStatuses[0] || '';

            // تجزئة الأوردرز حسب visibleCards
            this.groupedOrders = [];
            for (let i = 0; i < validOrders.length; i += this.visibleCards) {
              this.groupedOrders.push(validOrders.slice(i, i + this.visibleCards));
            }

            this.isLoading = false;
          },
          error: (err) => {
            this.errorMessage = 'فشل جلب تفاصيل الطلبات';
            console.error(err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.errorMessage = 'فشل جلب الطلبات';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onSlide(event: NgbSlideEvent) {
    this.currentIndex = +event.current;
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.carousel.prev();
    }
  }

  nextSlide() {
    if (this.currentIndex < this.groupedOrders.length - 1) {
      this.carousel.next();
    }
  }

  goToSlide(index: number) {
    this.carousel.select(index.toString());
    this.currentIndex = index;
  }

  // Getter لتجميع الأوردرز حسب الـ status
  get groupedOrdersByStatus() {
    const result: { [key: string]: any[][] } = {};

    if (!this.allOrders) return result;

    for (const status of this.orderStatuses) {
      const ordersOfStatus = this.allOrders.filter(order => order.status === status);

      const grouped: any[][] = [];
      for (let i = 0; i < ordersOfStatus.length; i += this.visibleCards) {
        grouped.push(ordersOfStatus.slice(i, i + this.visibleCards));
      }

      result[status] = grouped;
    }

    return result;
  }
}
