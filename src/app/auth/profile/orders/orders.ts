import { Component, OnInit, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../../models/Order';
import { NgbCarousel, NgbCarouselModule, NgbSlideEvent } from '@ng-bootstrap/ng-bootstrap';
import { catchError, forkJoin, of } from 'rxjs';
// import '@angular/localize/init';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, NgbCarouselModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class Orders implements OnInit, OnDestroy {
  @ViewChild(NgbCarousel) carousel!: NgbCarousel;

  isLoading = true;
  errorMessage = '';
  groupedOrders: any[][] = [];
  currentIndex = 0;
  visibleCards = 3; // Default for desktop
  private resizeListener!: () => void;

  constructor(private orderService: OrderService) { }

  // Update visible cards based on screen width
  updateVisibleCards(): void {
    const width = window.innerWidth;
    if (width < 768) {
      this.visibleCards = 1; // mobile
    } else {
      this.visibleCards = 3; // desktop
    }
    
    // Regroup orders when screen size changes
    if (this.groupedOrders.length > 0) {
      this.regroupOrders();
    }
  }

  // Regroup orders based on current visibleCards value
  regroupOrders(): void {
    const allOrders = this.groupedOrders.flat();
    this.groupedOrders = [];
    for (let i = 0; i < allOrders.length; i += this.visibleCards) {
      this.groupedOrders.push(allOrders.slice(i, i + this.visibleCards));
    }
  }

  // Touch events for mobile
  private touchStartX: number = 0;
  private touchEndX: number = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe() {
    const minSwipeDistance = 50; // Minimum distance for a swipe to be registered
    
    if (this.touchStartX - this.touchEndX > minSwipeDistance) {
      // Swipe left - next slide
      this.nextSlide();
    } else if (this.touchEndX - this.touchStartX > minSwipeDistance) {
      // Swipe right - previous slide
      this.prevSlide();
    }
  }

  ngOnInit() {
    this.loadOrders();
    this.updateVisibleCards();
    
    // Add resize listener with debounce to avoid excessive calls
    this.resizeListener = () => {
      clearTimeout((window as any).resizeTimer);
      (window as any).resizeTimer = setTimeout(() => {
        this.updateVisibleCards();
      }, 250);
    };
    
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  encodeUrl(url: string): string {
    return encodeURI(url);
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
            
            // Group orders based on current visibleCards value
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
}