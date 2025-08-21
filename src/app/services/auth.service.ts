import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * تسجيل الدخول → إرسال بيانات المستخدم للسيرفر
   */
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res?.token) {
          this.setLogin(res.token, res.user);
        }
      })
    );
  }

  /**
   * تسجيل الخروج
   */
  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.post(`${environment.apiBaseUrl}/logout`, {}, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      })
    }).pipe(
      tap(() => {
        this.clearAuth();
      })
    );
  }

  /**
   * حفظ بيانات تسجيل الدخول
   */
  setLogin(token: string, user?: any) {
    localStorage.setItem('token', token);
    if (user) {
      localStorage.setItem('client', JSON.stringify(user));
    }
    this.isLoggedInSubject.next(true);
  }

  /**
   * مسح بيانات تسجيل الدخول
   */
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('client');
    this.isLoggedInSubject.next(false);
  }

  /**
   * التحقق إذا فيه Token
   */
  checkAuth(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * getter للحالة الحالية
   */
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }
}
