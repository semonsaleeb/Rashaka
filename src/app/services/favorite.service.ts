// favorite.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from './product';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly apiUrl = `${environment.apiBaseUrl}/favorites`;
  private favorites: Product[] = [];
  private favoriteCountSubject = new BehaviorSubject<number>(0);
  favoriteCount$ = this.favoriteCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

toggleFavorite(product: Product, token: string): Observable<any> {
  const isFav = product.isFavorite;
  const endpoint = isFav ? 'remove' : 'add';
  const url = `${this.apiUrl}/${endpoint}`;
  const body = { product_id: product.id };

  console.log(`➡️ Request to: ${url}`, body);

  const headers = this.getAuthHeaders(token);

  // ❗ If removing, use DELETE method with body
  if (isFav) {
    return this.http.request('DELETE', url, {
      body,
      headers,
    });
  }

  // ✅ If adding, use POST
  return this.http.post(url, body, { headers });
}






loadFavorites(token: string): Observable<Product[]> {
  return this.http
    .get<{ favorites: Product[] }>(`${this.apiUrl}/list`, {
      headers: this.getAuthHeaders(token)
    })
    .pipe(map(response => response.favorites));
}

  

  setFavorites(favorites: Product[]) {
  this.favorites = favorites;
  this.favoriteCountSubject.next(favorites.length);
}


  
  getFavorites(): Product[] {
    return this.favorites;
  }


  clearFavorites(token: string): Observable<any> {
  const url = `${this.apiUrl}/clear`;
  const headers = this.getAuthHeaders(token);

  return this.http.delete(url, { headers });
}

}
