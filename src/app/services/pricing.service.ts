import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getPackages(type: string = 'session'): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    const url = `${this.baseUrl}/packages?type=${type}`;
    return this.http.get<any>(url, { headers });
  }

  subscribeToPackage(packageId: number): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.baseUrl}/subscribe-to-package`;
    return this.http.post<any>(url, { package_id: packageId }, { headers });
  }

  getActivePackage(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.baseUrl}/active-package`;
    return this.http.get<any>(url, { headers });
  }
}
