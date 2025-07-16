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

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.post(`${environment.apiBaseUrl}/logout`, {}, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      })
    }).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('client');
        this.isLoggedInSubject.next(false);
      })
    );
  }

  setLogin(token: string, user?: any) {
    localStorage.setItem('token', token);
    if (user) {
      localStorage.setItem('client', JSON.stringify(user));
    }
    this.isLoggedInSubject.next(true);
  }

  checkAuth(): boolean {
    return !!localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }
}
