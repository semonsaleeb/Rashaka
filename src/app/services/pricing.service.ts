import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Fetch available packages by type
   * @param type - 'session', 'membership', etc.
   */
  getPackages(type: string = 'session'): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    const url = `${this.baseUrl}/packages?type=${type}`;
    return this.http.get<any>(url, { headers });
  }

  getAllPackages(): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    const url = `${this.baseUrl}/packages`; // بدون type
    return this.http.get<any>(url, { headers });
  }


  // /**
  //  * Subscribe to a package directly (old endpoint, may be deprecated)
  //  * @param packageId - Package ID
  //  */
  // // subscribeToPackage(packageId: number): Observable<any> {
  // //   const token = localStorage.getItem('token');
  // //   if (!token) throw new Error('Authentication required');

  // //   const headers = new HttpHeaders({
  // //     'Accept': 'application/json',
  // //     'Authorization': `Bearer ${token}`,
  // //     'Content-Type': 'application/json'
  // //   });

  // //   const url = `${this.baseUrl}/subscribe-to-package`;
  // //   return this.http.post<any>(url, { package_id: packageId }, { headers });
  // // }

  /**
   * Subscribe the authenticated client to a package from the web
   * following the payment flow from the diagram.
   * @param packageId - Active package ID
   * @param paymentMethod - Payment method (e.g., 'cash', 'credit_card')
   * @param isPaid - True if payment completed
   */
  subscribeToPackageFromWeb(
    packageId: number,
    paymentMethod: string,
    isPaid: boolean
  ): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.baseUrl}/subscribe-to-package-from-web`;

    const body = {
      package_id: packageId,
      payment_method: paymentMethod,
      is_paid: isPaid
    };

    return this.http.post<any>(url, body, { headers });
  }

  /**
   * Fetch currently active package for the authenticated client
   */
  getActivePackage(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.baseUrl}/web-package`;
    return this.http.get<any>(url, { headers });
  }



}
