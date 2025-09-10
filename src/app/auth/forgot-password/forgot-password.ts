import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPassword {
  email = '';
  message = '';
  errorMessage = '';
  loading = false;
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction
  constructor(private translate: TranslateService, private languageService: LanguageService, private http: HttpClient, private router: Router) { }

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
  sendOtp() {
    this.loading = true;
    this.errorMessage = '';
    this.message = '';

    const headers = { 'Accept': 'application/json' };

    this.http.post<any>(`${environment.apiBaseUrl}/forgot-password`, { email: this.email }, { headers })
      .subscribe({
        next: (res) => {
          this.message = res.message || 'تم إرسال الرمز إلى بريدك الإلكتروني.';
          localStorage.setItem('otp-email', this.email);
          this.router.navigate(['/verify-otp']); // ✅ Navigate here
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'فشل إرسال الرمز. تأكد من البريد الإلكتروني.';
          this.loading = false;
        }
      });
  }
}
