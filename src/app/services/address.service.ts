import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddressData } from '../../models/address.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  addAddress(data: AddressData): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/address/add`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getAllAddresses(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/addresses`, {
      headers: this.getAuthHeaders()
    });
  }

  deleteAddress(address_id: number): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/address/delete`, { address_id }, {
      headers: this.getAuthHeaders()
    });
  }

  editAddress(data: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/address/edit`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getAddressById(address_id: number): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/address/get`, { address_id }, {
      headers: this.getAuthHeaders()
    });
  }
}
