import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  @Output() forgot = new EventEmitter<void>();

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.errorMessage = '';
    this.loading = true;

    const payload = { email: this.email, password: this.password };

    const headers = new HttpHeaders({ Accept: 'application/json' });

    this.http.post<any>(`${environment.apiBaseUrl}/login`, payload, { headers }).subscribe({
      next: (res) => {
        if (res.token && res.client) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('client', JSON.stringify(res.client));
          this.router.navigate(['/profile']);
        } else {
          this.errorMessage = 'بيانات تسجيل الدخول غير صحيحة.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'فشل تسجيل الدخول. تأكد من صحة البيانات.';
      }
    });
  }
}
