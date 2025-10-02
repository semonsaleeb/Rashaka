import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Branch } from '../../models/branch.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BranchesService {
  private apiUrl = `${environment.apiBaseUrl}/branches`; // use environment URL

  constructor(private http: HttpClient) {}

  getBranches(city_id?: number, status?: string, q?: string): Observable<{status: string, data: Branch[]}> {
    let params = new HttpParams();
    if (city_id) params = params.set('city_id', city_id);
    if (status) params = params.set('status', status);
    if (q) params = params.set('q', q);

    return this.http.get<{status: string, data: Branch[]}>(this.apiUrl, { params });
  }
    getBranchesByCity(cityId: number): Observable<any> {
    const params = new HttpParams().set('city_id', cityId.toString());
    return this.http.get(this.apiUrl, { params });
  }

}
