import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { Branch } from '../branch/branch';
import { Spicialist } from '../spicialist/spicialist';
import { Confirm } from '../confirm/confirm';
import { CommonModule } from '@angular/common';

declare var bootstrap: any; 

@Component({
  selector: 'app-free',
  imports: [Branch, Spicialist, Confirm, CommonModule, TranslateModule],
  templateUrl: './free.html',
  styleUrl: './free.scss'
})
export class Free implements OnInit {
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

  //  const appointmentToEdit = this.appointmentState.getData();
  // if (appointmentToEdit && Object.keys(appointmentToEdit).length > 0) {
  //   this.editingAppointment = appointmentToEdit;
  //   this.step = 1; // أو أي خطوة مناسبة لعرض النموذج
  // }
}



selectedMode: 'all' | 'free' = 'all';

openReservation(mode: 'all' | 'free') {
  this.selectedMode = mode;
  this.step = 1; // أو توديه للـ branch مباشرة
}

closeAuthModalAndCleanup() {
  // 1️⃣ اقفل المودال لو لسه مفتوح
  const modalEl = document.getElementById('authModal');
  if (modalEl) {
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    }
  }

  // 2️⃣ شيل أي Backdrop موجود
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.remove();
  });

  // 3️⃣ رجّع حالة الـ body لطبيعتها
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}
  goToStep(step: number) {
    this.step = step;
  }

goToLogin() {
  // ✅ حفظ الصفحة الحالية
  localStorage.setItem('redirectAfterLogin', this.router.url);
  this.router.navigate(['/auth/login']);
}

goToRegister() {
  // ✅ حفظ الصفحة الحالية
  localStorage.setItem('redirectAfterLogin', this.router.url);
  this.router.navigate(['/auth/register']);
}
}
