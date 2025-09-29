import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = `${environment.apiBaseUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    return this.http.get<any>(this.baseUrl, { headers });
  }

  uploadProfileImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    
    return this.http.post<any>(`${this.baseUrl}/image`, formData, { 
      headers: this.getImageUploadHeaders() 
    });
  }

  deleteProfileImage(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/image`, { 
      headers: this.getHeaders() 
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  private getImageUploadHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
      // Note: Don't set Content-Type for FormData - let browser set it automatically
    });
  }


  // داخل ClientService
updateProfile(data: { name: string; email: string; phone: string }): Observable<any> {
  const headers = this.getHeaders();
  return this.http.put<any>(this.baseUrl, data, { headers });
}
isLoggedIn(): boolean {
  const token = localStorage.getItem('token');
  return !!token; // true if token exists, false otherwise
}

}
