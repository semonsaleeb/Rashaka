import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPassword {
  email = '';
  message = '';
  errorMessage = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

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
