import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-downloadapp',
  imports: [CommonModule, TranslateModule],
  templateUrl: './downloadapp.html',
  styleUrl: './downloadapp.scss'
})
export class Downloadapp implements OnInit {
  dir: 'ltr' | 'rtl' = 'rtl';
  isMobile = window.innerWidth < 768;
  isArabic = true;
  currentLang: string = 'ar';

  constructor(private translate: TranslateService,     private languageService: LanguageService) {}

  ngOnInit(): void {
    // بدل currentLang نستخدم getDefaultLang() أو getBrowserLang()
    const lang = this.translate.getDefaultLang() || this.translate.getBrowserLang() || 'ar';
    this.isArabic = lang === 'ar';
    this.dir = this.isArabic ? 'rtl' : 'ltr';

    // الاستماع لتغير اللغة
    this.translate.onLangChange.subscribe(event => {
      this.isArabic = event.lang === 'ar';
      this.dir = this.isArabic ? 'rtl' : 'ltr';
    });
      this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }
}
