// src/app/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_ENDPOINTS } from '../core/api-endpoints';

export interface Blog {
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  image: string;
  created_at: string;
  author: string;
}

interface BlogsResponse {
  status: string;
  blogs: Blog[];
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getBlogs(): Observable<Blog[]> {
    const url = `${this.baseUrl}${API_ENDPOINTS.blogs.getAll}`;
    console.log('Fetching blogs from:', url); // Debugging
    
    return this.http.get<BlogsResponse>(url).pipe(
      map(response => {
        if (response.status !== 'success') {
          throw new Error('Invalid response format');
        }
        return response.blogs.map(blog => ({
          ...blog,
          image: this.fixImageUrl(blog.image) // Fix image URLs if needed
        }));
      }),
      catchError(error => {
        console.error('Error fetching blogs:', error);
        return throwError(() => new Error('فشل تحميل المقالات. الرجاء المحاولة لاحقًا'));
      })
    );
  }

  private fixImageUrl(url: string): string {
    // Add any necessary URL fixes here
    return url;
  }
}