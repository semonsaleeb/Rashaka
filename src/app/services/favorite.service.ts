// favorite.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './product'; // replace with your actual product model

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private favorites: Product[] = [];
  private favoriteCountSubject = new BehaviorSubject<number>(0);

  favoriteCount$ = this.favoriteCountSubject.asObservable();

  toggleFavorite(product: Product) {
    const index = this.favorites.findIndex(p => p.id === product.id);
    if (index === -1) {
      this.favorites.push(product);
      product.isFavorite = true;
    } else {
      this.favorites.splice(index, 1);
      product.isFavorite = false;
    }
    this.favoriteCountSubject.next(this.favorites.length);
  }

  getFavorites(): Product[] {
    return this.favorites;
  }

  getFavoriteCount(): number {
    return this.favorites.length;
  }
}
