// favorite.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { Product } from '../../models/Product';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly apiUrl = `${environment.apiBaseUrl}/favorites`;

  // 🟢 بنحتفظ بالـ favorites كـ BehaviorSubject علشان أي كومبوننت يسمع التغييرات
  private favoritesSubject = new BehaviorSubject<Product[]>(this.getLocalFavorites());
  favorites$ = this.favoritesSubject.asObservable();

  private favoriteCountSubject = new BehaviorSubject<number>(this.getLocalFavorites().length);
  favoriteCount$ = this.favoriteCountSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ✅ توجل الفافوريت سواء مع API أو Local
  toggleFavorite(product: Product, token: string | null): Observable<any> {
    if (!token) {
      this.toggleLocalFavorite(product);
      return new Observable(observer => {
        observer.next(product);
        observer.complete();
      });
    }

    const isFav = product.isFavorite;
    const endpoint = isFav ? 'remove' : 'add';
    const url = `${this.apiUrl}/${endpoint}`;
    const body = { product_id: product.id };
    const headers = this.getAuthHeaders(token);

    if (isFav) {
      return this.http.request('DELETE', url, { body, headers }).pipe(
        map(() => {
          // 🟢 remove من الحالة
          const updated = this.getFavorites().filter(f => f.id !== product.id);
          this.updateFavoritesState(updated);
          return { success: true };
        })
      );
    } else {
      return this.http.post(url, body, { headers }).pipe(
        map(() => {
          // 🟢 add للحالة
          const updated = [...this.getFavorites(), product];
          this.updateFavoritesState(updated);
          return { success: true };
        })
      );
    }
  }


  // ✅ تحديث الـ localStorage + broadcast للتغييرات
  private toggleLocalFavorite(product: Product) {
    let favs = this.getLocalFavorites();
    if (favs.some(f => f.id === product.id)) {
      favs = favs.filter(f => f.id !== product.id);
    } else {
      favs.push(product);
    }
    this.updateFavoritesState(favs);
  }

  // ✅ load favorites سواء من API أو local
  loadFavorites(token: string | null): Observable<Product[]> {
    if (!token) {
      const localFavs = this.getLocalFavorites();
      this.updateFavoritesState(localFavs);
      return new Observable(observer => {
        observer.next(localFavs);
        observer.complete();
      });
    }

    return this.http
      .get<{ favorites: Product[] }>(`${this.apiUrl}/list`, {
        headers: this.getAuthHeaders(token)
      })
      .pipe(
        map(response => {
          this.updateFavoritesState(response.favorites);
          return response.favorites;
        })
      );
  }

  // ✅ مسح الفافوريت
  clearFavorites(token: string | null): Observable<any> {
    if (!token) {
      this.updateFavoritesState([]);
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    const url = `${this.apiUrl}/clear`;
    const headers = this.getAuthHeaders(token);
    return this.http.delete(url, { headers });
  }

  // ✅ Helpers
  private updateFavoritesState(favs: Product[]) {
    localStorage.setItem('favorites', JSON.stringify(favs));
    this.favoritesSubject.next(favs);
    this.favoriteCountSubject.next(favs.length);
  }

  getLocalFavorites(): Product[] {
    const favs = localStorage.getItem('favorites');
    return favs ? JSON.parse(favs) : [];
  }

  setFavorites(favorites: Product[]) {
    this.updateFavoritesState(favorites);
  }

  getFavorites(): Product[] {
    return this.favoritesSubject.value;
  }

  clearLocalFavorites(): void {
    this.updateFavoritesState([]);
  }

  removeLocalFavorite(productId: number): void {
    let favs = this.getLocalFavorites().filter(f => f.id !== productId);
    this.updateFavoritesState(favs);
  }
}
