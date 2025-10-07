import { CommonModule, ViewportScroller } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, TranslateModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

  constructor( private languageService: LanguageService, private viewportScroller: ViewportScroller, public translate: TranslateService) {}

   currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';

  ngOnInit(): void {
;

          // إعداد اللغة
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    this.languageService.currentLang$.subscribe((lang) => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  
  }

scrollToTop() {
  this.viewportScroller.scrollToPosition([0, 0]);
}
// formatText(text: string): string {
//   if (!text) return '';
//   const words = text.split(' ');
//   return words.map((word, i) =>
//     (i + 1) % 5 === 0 ? word + '<br>' : word
//   ).join(' ');
// }


}
