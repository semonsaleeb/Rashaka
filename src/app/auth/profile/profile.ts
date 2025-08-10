import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [HttpClientModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  client: any = null;
  errorMessage: string = '';
@ViewChild('detailsLink') detailsLink!: ElementRef;

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

  ngAfterViewInit() {
  // تأكد من وجود العنصر
  setTimeout(() => this.detailsLink?.nativeElement?.focus(), 0);
}
}
