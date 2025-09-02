import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CartViewItem } from '../../models/CartViewItem';
import { CartService } from './cart.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private cartService: CartService) {} // ✅ added cartService

  /**
   * تسجيل الدخول → إرسال بيانات المستخدم للسيرفر
   */
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res?.token) {
          this.setLogin(res.token, res.user);

          // 🟢 Merge Guest Cart بعد تسجيل الدخول
          this.mergeGuestCartAfterLogin();
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
        localStorage.removeItem('guest_cart'); // 🟢 ضمان نظافة الكارت
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
   * دمج كارت الضيف مع كارت المستخدم بعد تسجيل الدخول
   */
  mergeGuestCartAfterLogin(): void {
    const guestCart: CartViewItem[] = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    if (!guestCart || guestCart.length === 0) return;

    guestCart.forEach(item => {
      this.cartService.addToCart(item.product_id, item.quantity).subscribe({
        next: () => console.log(`Merged item ${item.product_id} to server cart`),
        error: (err) => console.error('Failed to merge guest cart:', err)
      });
    });

    // 🟢 بعد الدمج امسح الكارت المحلي
    localStorage.removeItem('guest_cart');
  }

  /**
   * getter للحالة الحالية
   */
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  /** حدث حالة تسجيل الدخول */
setLoggedInState(value: boolean) {
  this.isLoggedInSubject.next(value);
}

}
