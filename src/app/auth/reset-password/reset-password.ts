import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  constructor(private http: HttpClient, private router: Router) {}

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
