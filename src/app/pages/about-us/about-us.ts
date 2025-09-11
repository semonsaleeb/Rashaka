import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Branches } from '../home/branches/branches';
import { SucesStory } from '../home/suces-story/suces-story';
import { Downloadapp } from '../home/downloadapp/downloadapp';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, Branches, SucesStory, TranslateModule],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.scss']
})
export class AboutUs implements OnInit {
  stats = [
    { value: '40+', label: 'STATS_LABEL_BRANCHES' },
    { value: '285+', label: 'STATS_LABEL_AMOUNT' },
    { value: '500+', label: 'STATS_LABEL_EMPLOYEES' },
    { value: '100,000+', label: 'STATS_LABEL_CLIENTS' }
  ];

  currentLang: string = 'ar';

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService
  ) {
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
}
