import { CommonModule } from '@angular/common';
import { Component, ElementRef, AfterViewInit, ViewChildren, QueryList, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-post-hero',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './post-hero.html',
  styleUrls: ['./post-hero.scss']
})
export class PostHero implements OnInit, AfterViewInit {
  stats = [
    { number: 40, suffix: '+', textKey: 'STATS.BRANCHES' },
    { number: 285, suffix: '+', textKey: 'STATS.PRODUCTS' },
    { number: 500, suffix: '+', textKey: 'STATS.EMPLOYEES' },
    { number: 100000, suffix: '+', textKey: 'STATS.CLIENTS' }
  ];

  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';

  @ViewChildren('statNumber') statNumbers!: QueryList<ElementRef>;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animateStats(), 100); // لضمان جاهزية الـ DOM
  }

  animateStats() {
    this.statNumbers.forEach((elRef, index) => {
      const target = this.stats[index].number;
      const suffix = this.stats[index].suffix || '';
      let count = 0;
      const step = Math.ceil(target / 200); // سرعة العد

      const interval = setInterval(() => {
        count += step;
        if (count >= target) {
          count = target;
          clearInterval(interval);
        }
        elRef.nativeElement.textContent = this.formatNumber(count) + suffix;
      }, 20);
    });
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
