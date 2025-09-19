import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class OurService {
 cards = [
  {
    icon: 'assets/Images/22. Stethoscope.svg',
    titleKey: 'SERVICES.CARD1.TITLE',
    descriptionKey: 'SERVICES.CARD1.DESCRIPTION',
    link: '/reservation/free'
  },
  {
    icon: 'assets/Images/Doctor.svg',
    titleKey: 'SERVICES.CARD2.TITLE',
    descriptionKey: 'SERVICES.CARD2.DESCRIPTION',
    link: '/reservation/all'
  },
  {
    icon: 'assets/Images/Rice Bowl.svg',
    titleKey: 'SERVICES.CARD3.TITLE',
    descriptionKey: 'SERVICES.CARD3.DESCRIPTION',
    link: '/reservation/all'
  }
];

  direction: 'ltr' | 'rtl' = 'ltr';

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    const lang = this.languageService.getCurrentLanguage();
    this.translate.use(lang);
    this.direction = lang === 'ar' ? 'rtl' : 'ltr';

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.translate.use(lang);
      this.direction = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  onGetStarted() {
    console.log('Get started clicked');
  }
}
