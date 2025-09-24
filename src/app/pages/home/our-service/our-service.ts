// import { CommonModule } from '@angular/common';
// import { AfterViewInit, Component, OnDestroy } from '@angular/core';
// import { RouterModule } from '@angular/router';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';
// import { LanguageService } from '../../../services/language.service';

// @Component({
//   selector: 'app-our-service',
//   templateUrl: './our-service.html',
//   styleUrls: ['./our-service.scss'],
//   standalone: true,
//   imports: [CommonModule, RouterModule, TranslateModule],
// })
// export class OurService implements AfterViewInit, OnDestroy {
//   direction: 'ltr' | 'rtl' = 'rtl';

//   cards = [
//     {
//       icon: 'assets/Images/22. Stethoscope.svg',
//       titleKey: 'SERVICES.CARD1.TITLE',
//       descriptionKey: 'SERVICES.CARD1.DESCRIPTION',
//       link: '/reservation/free',
//     },
//     {
//       icon: 'assets/Images/Doctor.svg',
//       titleKey: 'SERVICES.CARD2.TITLE',
//       descriptionKey: 'SERVICES.CARD2.DESCRIPTION',
//       link: '/reservation/all',
//     },
//     {
//       icon: 'assets/Images/Rice Bowl.svg',
//       titleKey: 'SERVICES.CARD3.TITLE',
//       descriptionKey: 'SERVICES.CARD3.DESCRIPTION',
//       link: '/reservation/all',
//     },
//   ];

//   private carouselElement: HTMLElement | null = null;
//   private touchStartX: number = 0;
//   private touchEndX: number = 0;

//   constructor(
//     private translate: TranslateService,
//     private languageService: LanguageService
//   ) {}

//   ngAfterViewInit(): void {
//     this.carouselElement = document.getElementById('servicesCarousel');

//     if (this.carouselElement) {
//       this.carouselElement.addEventListener('touchstart', this.onTouchStart);
//       this.carouselElement.addEventListener('touchend', this.onTouchEnd);
//     }

//     // متابعة اللغة لتحديث الاتجاه
//     const lang = this.languageService.getCurrentLanguage();
//     this.translate.use(lang);
//     this.direction = lang === 'ar' ? 'rtl' : 'ltr';

//     this.languageService.currentLang$.subscribe((lang) => {
//       this.translate.use(lang);
//       this.direction = lang === 'ar' ? 'rtl' : 'ltr';
//     });
//   }

//   ngOnDestroy(): void {
//     if (this.carouselElement) {
//       this.carouselElement.removeEventListener('touchstart', this.onTouchStart);
//       this.carouselElement.removeEventListener('touchend', this.onTouchEnd);
//     }
//   }

//   private onTouchStart = (e: TouchEvent) => {
//     this.touchStartX = e.changedTouches[0].screenX;
//   };

//   private onTouchEnd = (e: TouchEvent) => {
//     this.touchEndX = e.changedTouches[0].screenX;
//     this.handleSwipe();
//   };

//   // private handleSwipe() {
//   //   if (!this.carouselElement) return;
//   //   const carousel = new (window as any).bootstrap.Carousel(this.carouselElement);

//   //   const isRTL = this.direction === 'rtl';

//   //   if (isRTL) {
//   //     // RTL: نعكس الاتجاه
//   //     if (this.touchEndX < this.touchStartX - 40) {
//   //       carousel.prev();
//   //     }
//   //     if (this.touchEndX > this.touchStartX + 40) {
//   //       carousel.next();
//   //     }
//   //   } else {
//   //     // LTR: الاتجاه الطبيعي
//   //     if (this.touchEndX < this.touchStartX - 40) {
//   //       carousel.next();
//   //     }
//   //     if (this.touchEndX > this.touchStartX + 40) {
//   //       carousel.prev();
//   //     }
//   //   }
//   // }
//   private handleSwipe() {
//   if (!this.carouselElement) return;
//   const carousel = new (window as any).bootstrap.Carousel(this.carouselElement);

//   // ما فيش عكس في RTL، نفس الـ LTR
//   if (this.touchEndX < this.touchStartX - 40) {
//     carousel.next();
//   }
//   if (this.touchEndX > this.touchStartX + 40) {
//     carousel.prev();
//   }
// }

// }
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-our-service',
  templateUrl: './our-service.html',
  styleUrls: ['./our-service.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
})
export class OurService implements AfterViewInit {
  direction: 'ltr' | 'rtl' = 'rtl';
  currentSlideIndex = 0;
  visibleCards = 1; // موبايل: كارت واحد في كل مرة

  cards = [
    {
      icon: 'assets/Images/22. Stethoscope.svg',
      titleKey: 'SERVICES.CARD1.TITLE',
      descriptionKey: 'SERVICES.CARD1.DESCRIPTION',
      link: '/reservation/free',
      button: 'SERVICES.BOOK_NOW1'
    },
    {
      icon: 'assets/Images/Doctor.svg',
      titleKey: 'SERVICES.CARD2.TITLE',
      descriptionKey: 'SERVICES.CARD2.DESCRIPTION',
      link: '/reservation/all',
            button: 'SERVICES.BOOK_NOW2'

    },
    {
      icon: 'assets/Images/Rice Bowl.svg',
      titleKey: 'SERVICES.CARD3.TITLE',
      descriptionKey: 'SERVICES.CARD3.DESCRIPTION',
      link: '/home/Shop',
            button: 'SERVICES.BOOK_NOW3'

    },
  ];

  private touchStartX: number = 0;
  private touchEndX: number = 0;

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  ngAfterViewInit(): void {
    const lang = this.languageService.getCurrentLanguage();
    this.translate.use(lang);
    this.direction = lang === 'ar' ? 'rtl' : 'ltr';

    this.languageService.currentLang$.subscribe((lang) => {
      this.translate.use(lang);
      this.direction = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

 private handleSwipe(): void {
  if (this.direction === 'rtl') {
    // RTL: نعكس الاتجاه
    if (this.touchEndX < this.touchStartX - 40) {
      this.prevSlide(); // بدل next
    }
    if (this.touchEndX > this.touchStartX + 40) {
      this.nextSlide(); // بدل prev
    }
  } else {
    // LTR: طبيعي
    if (this.touchEndX < this.touchStartX - 40) {
      this.nextSlide();
    }
    if (this.touchEndX > this.touchStartX + 40) {
      this.prevSlide();
    }
  }
}


  nextSlide(): void {
    if (this.currentSlideIndex < this.cards.length - 1) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }
}
