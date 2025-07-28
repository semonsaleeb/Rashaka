// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_ENDPOINTS } from '../core/api-endpoints';

export interface Product {
  category_id: number;
  id: number;
  name: string;
  name_ar: string;
  description:string;
  stock: number;
  price: string;         // string because it's "25.00" in quotes
  sale_price: string;    // same here
  cart_quantity: number;
  images: string[];
  categories: Category[];
  isFavorite?: boolean;  // optional if you're using a favorites system
}
export interface Category {
  id: number;
  name: string;
  name_ar: string;
}


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  // Get all products
getProducts(): Observable<Product[]> {
  return this.http
    .get<{ status: string; data: Product[] }>(this.getFullUrl(API_ENDPOINTS.products.getAll))
    .pipe(map(response => response.data));
}

 getOffer(): Observable<Product[]> {
  return this.http
    .get<{ status: string; data: Product[] }>(`${this.baseUrl}/offers`).pipe(map(response => response.data));
}



  
  getProductById(id: number, token: string): Observable<Product> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    });

    const url = `${this.baseUrl}?product_id=${id}`;

    return this.http.get<{ status: string; data: Product }>(url, { headers }).pipe(
      map(response => response.data)
    );
  }


  // Get products by category
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(this.getFullUrl(API_ENDPOINTS.products.getByCategory(category)));
  }

  // Create new product
  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.getFullUrl(API_ENDPOINTS.products.create), product);
  }

  // Update existing product
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(this.getFullUrl(API_ENDPOINTS.products.update(id)), product);
  }

  // Delete product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(this.getFullUrl(API_ENDPOINTS.products.delete(id)));
  }

  // Helper method to construct full URL
  private getFullUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
}