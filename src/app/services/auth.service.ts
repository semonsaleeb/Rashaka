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

    return this.http.post(
      `${environment.apiBaseUrl}/logout`,
      {},
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        })
      }
    ).pipe(
      tap(() => {
        localStorage.removeItem('token');
        this.isLoggedInSubject.next(false);
      })
    );
  }

  checkAuth(): boolean {
    return !!localStorage.getItem('token');
  }

  setLogin(token: string) {
    localStorage.setItem('token', token);
    this.isLoggedInSubject.next(true);
  }
}
