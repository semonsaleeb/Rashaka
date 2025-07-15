import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  client: any = null;
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'يرجى تسجيل الدخول لعرض الملف الشخصي.';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    this.http.get<any>(`${environment.apiBaseUrl}/profile`, { headers }).subscribe({
      next: (res) => {
        this.client = res.client;
      },
      error: (err) => {
        console.error('فشل جلب البيانات:', err);
        this.errorMessage = 'حدث خطأ أثناء تحميل البيانات.';
      }
    });
  }
}
