import { Component, OnInit } from '@angular/core';
import { Branch } from './branch/branch';
import { Spicialist } from './spicialist/spicialist';
import { Confirm } from './confirm/confirm';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

declare var bootstrap: any; // عشان نقدر نستدعي Bootstrap Modal

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [Branch, Spicialist, Confirm, CommonModule, TranslateModule],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.scss']
})
export class Appointments implements OnInit {
  step = 1;
  token: string | null = null;

  constructor(private router: Router, private translate: TranslateService,  private languageService: LanguageService) {}
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; 

  ngOnInit(): void {
    this.token = localStorage.getItem('token');

    if (!this.token) {
      // افتح المودال أول ما يدخل
      const modalEl = document.getElementById('authModal');
      if (modalEl) {
        const myModal = new bootstrap.Modal(modalEl, {
          backdrop: 'static',
          keyboard: false
        });
        myModal.show();
      }
    }
  // Set initial language
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });
  }

  goToStep(step: number) {
    this.step = step;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
