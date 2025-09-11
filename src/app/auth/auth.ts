import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Login } from './login/login';
import { Register } from './register/register';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, Login, Register, RouterModule, TranslateModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss']
})
export class Auth {
  activeTab: 'login' | 'register' = 'login'; // Default tab
  constructor( private translate: TranslateService, private languageService: LanguageService) {}


  
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

  ngOnInit(): void {

    // Set initial language
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }


  
  setTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }
}
