import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router ,   private auth: AuthService) {}

  login() {
    this.loading = true;
    this.errorMessage = '';

    const data = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>(`${environment.apiBaseUrl}/login`, data, {
      headers: new HttpHeaders({ 'Accept': 'application/json' })
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
          this.auth.setLogin(res.token); 
        this.router.navigate(['/']); // Navigate to homepage after login
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'فشل تسجيل الدخول';
        this.loading = false;
      }
    });
  }
}
