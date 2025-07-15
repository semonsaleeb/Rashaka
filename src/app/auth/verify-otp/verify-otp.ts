import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-otp.html',
  styleUrls: ['./verify-otp.scss']
})
export class VerifyOtp implements OnInit {
  email = '';
  otp: string[] = ['', '', '', ''];
  message = '';
  errorMessage = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const storedEmail = localStorage.getItem('otp-email');
    if (storedEmail) {
      this.email = storedEmail;
    }
  }

  moveToNext(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length === 1 && index < 3) {
      const next = document.querySelector(`[name="otp${index + 1}"]`) as HTMLInputElement;
      if (next) next.focus();
    }

    if (event.inputType === 'deleteContentBackward' && value === '' && index > 0) {
      const prev = document.querySelector(`[name="otp${index - 1}"]`) as HTMLInputElement;
      if (prev) prev.focus();
    }
  }

 verifyOtp() {
  this.loading = true;
  this.errorMessage = '';
  this.message = '';

  const code = this.otp.join('');
  console.log('OTP entered:', code);

  if (code.length !== 4 || !/^\d{4}$/.test(code)) {
    this.errorMessage = 'الرمز يجب أن يتكون من 4 أرقام.';
    this.loading = false;
    return;
  }

  const headers = { 'Accept': 'application/json' };

  // ✅ Send OTP as integer
  this.http.post<any>(`${environment.apiBaseUrl}/verify-otp`, {
    email: this.email,
    otp: parseInt(code, 10)
  }, { headers }).subscribe({
    next: res => {
      this.message = res.message || 'تم التحقق بنجاح!';
      localStorage.setItem('reset-email', this.email);
      this.router.navigate(['/reset-password']);
      this.loading = false;
    },
    error: err => {
      console.error('OTP Verification Error:', err);
      this.errorMessage = err.error?.message || 'فشل التحقق من الرمز.';
      this.loading = false;
    }
  });
}

}
