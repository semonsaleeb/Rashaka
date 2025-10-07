import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterModule, TranslateModule, CommonModule  ],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss']
})
export class ResetPassword {
  email = localStorage.getItem('reset-email') || '';
  password = '';
  password_confirmation = '';
  message = '';
  errorMessage = '';
  loading = false;
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction
  constructor(private translate: TranslateService, private languageService: LanguageService, private http: HttpClient, private router: Router) {}


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
resetPassword() {
  this.message = '';
  this.errorMessage = '';
  this.loading = true;

  const headers = { 'Accept': 'application/json' };
  const payload = {
    email: this.email,
    password: this.password,
    password_confirmation: this.password_confirmation
  };

  this.http.post<any>(`${environment.apiBaseUrl}/reset-password`, payload, { headers })
    .subscribe({
      next: (res) => {
        // ✅ رسالة النجاح مترجمة
        this.message = res.message || this.translate.instant('AUTH.PASSWORD_RESET_SUCCESS');
        localStorage.removeItem('reset-email');
        this.router.navigate(['/reset-password-done']);
      },
     error: (err) => {
  console.log('🔥 Full API Error Object:', err);  // 👈 ده اللي هيوضح الرسالة الفعلية

  const apiMessage: string = err.error?.message;
  console.log('📝 API Error Message:', apiMessage);

const apiToTranslationKey: Record<string, string> = {
  'The password field is required.': 'VALIDATION.PASSWORD_REQUIRED',
  'The email field is required.': 'VALIDATION.EMAIL_REQUIRED',
  'The email must be a valid email address.': 'VALIDATION.EMAIL_INVALID',
  'The password field confirmation does not match.': 'VALIDATION.PASSWORD_CONFIRM_MISMATCH' // ✅ تم التعديل هنا
};


  const translationKey = apiToTranslationKey[apiMessage];

  this.errorMessage = translationKey
    ? this.translate.instant(translationKey)
    : apiMessage || this.translate.instant('AUTH.PASSWORD_RESET_FAILED');

  this.loading = false;
}

    });
}




  showPassword = false;
showConfirmPassword = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

toggleConfirmPasswordVisibility() {
  this.showConfirmPassword = !this.showConfirmPassword;
}

}
