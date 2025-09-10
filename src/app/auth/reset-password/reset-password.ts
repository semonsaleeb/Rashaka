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
        next: res => {
          this.message = res.message || 'تمت إعادة تعيين كلمة المرور بنجاح.';
          localStorage.removeItem('reset-email');
          this.router.navigate(['/reset-password-done']);
        },
        error: err => {
          this.errorMessage = err.error?.message || 'فشل إعادة تعيين كلمة المرور.';
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
