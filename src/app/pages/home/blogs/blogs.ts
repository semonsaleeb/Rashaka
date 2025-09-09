import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Blog, BlogService } from '../../../services/blogs.service';
import { AssetUtils } from '../../../utils/asset.utils';
import { TruncatePipe } from '../../../pipes/truncate-pipe';
import { Downloadapp } from '../downloadapp/downloadapp';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, TruncatePipe, Downloadapp, TranslateModule],
  templateUrl: './blogs.html',
  styleUrls: ['./blogs.scss'],
})
export class Blogs implements OnInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';
  blogs: Blog[] = [];
  loading = true;
  currentSlideIndex = 0;
  visibleCards = 3;
  currentLang: string = 'ar';



  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

  constructor(private blogService: BlogService, private translate: TranslateService, private languageService: LanguageService) {}

  ngOnInit(): void {
  this.setVisibleCards();
  this.loadBlogs();

  // Set initial language
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });
}


  /** 🔥 يغيّر عدد الكروت حسب حجم الشاشة */
  @HostListener('window:resize')
  onResize() {
    this.setVisibleCards();
  }

  setVisibleCards(): void {
    if (window.innerWidth < 576) {
      this.visibleCards = 1; // موبايل
    } else if (window.innerWidth < 992) {
      this.visibleCards = 2; // تابلت
    } else {
      this.visibleCards = 3; // ديسكتوب
    }
    // لو الكاروسيل واقف على سلايد مش موجود بعد التغيير يرجعه
    if (this.currentSlideIndex > this.blogs.length - this.visibleCards) {
      this.currentSlideIndex = Math.max(0, this.blogs.length - this.visibleCards);
    }

      this.translate.use(this.languageService.getCurrentLanguage());

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.translate.use(lang);
    });
  }

  loadBlogs(): void {
    this.blogService.getBlogs().subscribe({
      next: (blogs) => {
        this.blogs = blogs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load blogs:', err);
        this.loading = false;
      }
    });
  }

  getSafeImage(url: string): string {
    return AssetUtils.getSafeImageUrl(url);
  }

  parseContent(content: string): string {
    try {
      const parsed = JSON.parse(content);
      if (parsed.ops) {
        return parsed.ops
          .filter((op: any) => op.insert)
          .map((op: any) => {
            let text = op.insert;
            if (op.attributes?.bold) {
              text = `<strong>${text}</strong>`;
            }
            return text;
          })
          .join('')
          .replace(/\n/g, '<br>');
      }
      return content;
    } catch {
      return content;
    }
  }

  getDotsArray(): number[] {
    const slideCount = Math.ceil(this.blogs.length / this.visibleCards);
    return Array.from({ length: slideCount }, (_, i) => i);
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  nextSlide(): void {
    if (this.currentSlideIndex < this.blogs.length - this.visibleCards) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  onBlogClick(id: number): void {
    // console.log('Clicked blog ID:', id);
  }


  touchStartX = 0;
touchEndX = 0;

onTouchStart(event: TouchEvent): void {
  this.touchStartX = event.changedTouches[0].screenX;
}

onTouchEnd(event: TouchEvent): void {
  this.touchEndX = event.changedTouches[0].screenX;
  this.handleSwipe();
}

handleSwipe(): void {
  const swipeDistance = this.touchEndX - this.touchStartX;

  if (Math.abs(swipeDistance) > 50) { // عتبة عشان ما يعتبرش اللمسة العادية Swipe
    if (swipeDistance > 0) {
      // 👉 Swipe يمين → روح للسابق
      this.nextSlide();
    } else {
      // 👈 Swipe شمال → روح للي بعده
      this.prevSlide();
    }
  }
}

}
