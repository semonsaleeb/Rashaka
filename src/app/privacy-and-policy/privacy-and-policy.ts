import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-privacy-and-policy',
  imports: [CommonModule, TranslateModule],
  templateUrl: './privacy-and-policy.html',
  styleUrl: './privacy-and-policy.scss'
})



export class PrivacyAndPolicy {
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';

  constructor(
    private cdr: ChangeDetectorRef,
    private languageService: LanguageService,
    private translate: TranslateService,

  ) { }
  ngOnInit(): void {

    this.currentLang = this.languageService.getCurrentLanguage();
    this.translate.use(this.currentLang);

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }
}
