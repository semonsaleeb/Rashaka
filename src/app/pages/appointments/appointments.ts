import { Component, OnInit } from '@angular/core';
import { Branch } from './branch/branch';
import { Spicialist } from './spicialist/spicialist';
import { Confirm } from './confirm/confirm';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { routes } from '../../app.routes';
imports: [
  RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })
]

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

  constructor(  private route: ActivatedRoute, private router: Router, private translate: TranslateService,  private languageService: LanguageService) {}
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; 

ngOnInit(): void {
  // 1- هات التوكن
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

  // 2- اضبط اللانجوج في البداية
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // 3- Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });

  // 4- استقبل الـ mode من الـ route param
  this.route.params.subscribe(params => {
    this.selectedMode = params['mode'] === 'free' ? 'free' : 'all';
    console.log('📌 Current mode:', this.selectedMode);
  });

   this.route.url.subscribe(urlSegments => {
    const lastSegment = urlSegments[urlSegments.length - 1]?.path;
    this.selectedMode = lastSegment === 'free' ? 'free' : 'all';
    console.log('📌 Current mode:', this.selectedMode);
    this.step = 1; // reset steps كل مرة تدخل Path جديد
  });
}



selectedMode: 'all' | 'free' = 'all';

openReservation(mode: 'all' | 'free') {
  this.selectedMode = mode;
  this.step = 1; // أو توديه للـ branch مباشرة
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
