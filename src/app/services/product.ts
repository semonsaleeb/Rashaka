// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_ENDPOINTS } from '../core/api-endpoints';
import { Product } from '../../models/Product';


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Get all products
  getProducts(): Observable<Product[]> {
    return this.http
      .get<{ status: string; data: Product[] }>(`${this.baseUrl}/products`)
      .pipe(map(response => response.data));
  }

  getOffer(): Observable<Product[]> {
    return this.http
      .get<{ status: string; data: Product[] }>(`${this.baseUrl}/offers`)
      .pipe(map(response => response.data));
  }

  getProductById(id: number, token: string): Observable<Product> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    });

    const url = `${environment.apiBaseUrl}/product?product_id=${id}`;

    return this.http
      .get<{ status: string; data: Product }>(url, { headers })
      .pipe(
        map(response => {
          if (!response.data) throw new Error(`Product with ID ${id} not found`);
          return response.data;
        })
      );
  }

  getProductsByCategory(
    categoryId: number,
    token?: string
  ): Observable<Product[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    const url = `${this.baseUrl}/products?category_id=${categoryId}`;
    return this.http
      .get<{ status: string; data: Product[] }>(url, { headers })
      .pipe(map(res => res.data));
  }

  // Create new product
  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(
      this.getFullUrl(API_ENDPOINTS.products.create),
      product
    );
  }

  // Update existing product
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(
      this.getFullUrl(API_ENDPOINTS.products.update(id)),
      product
    );
  }

  // Delete product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(
      this.getFullUrl(API_ENDPOINTS.products.delete(id))
    );
  }

  /**
   * Get client's free product balance from active package
   */
 getFreeProductBalance(token: string): Observable<ApiResponse<FreeProductBalanceResponse>> {
  const headers = new HttpHeaders({
    Accept: 'application/json',
    Authorization: `Bearer ${token}`
  });

  const url = `${this.baseUrl}/free-product-balance`;
  return this.http.get<ApiResponse<FreeProductBalanceResponse>>(url, { headers });
}

  // Helper method to construct full URL
  private getFullUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
}
