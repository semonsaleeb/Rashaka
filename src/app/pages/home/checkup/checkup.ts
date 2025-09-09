import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-checkup',
  imports: [RouterModule, TranslateModule, CommonModule],
  templateUrl: './checkup.html',
  styleUrl: './checkup.scss'
})
export class Checkup {
  isArabic: boolean = true; // ضبطها حسب اللغة الحالية
  currentLang: string = 'ar';

// لو تستخدم ngx-translate
  constructor(private translate: TranslateService,     private languageService: LanguageService) {
    this.isArabic = this.translate.getCurrentLang() === 'ar';
    
    this.translate.addLangs(['en', 'ar']);
  
  }

  ngOnInit() {
    // Subscribe to language changes from the service
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }

  switchLanguage(lang: string) {
    this.languageService.setLanguage(lang); // triggers subscription automatically
  }

  onGetStarted() {
    // console.log('Get started clicked');
    // Add your navigation logic here
  }
}
