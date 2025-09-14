

// src/app/services/success-story.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SuccessStory } from '../../models/SuccessStory';

interface ApiResponse {
  status: string;
  data: SuccessStory[];
}

@Injectable({
  providedIn: 'root'
})
export class SuccessStoryService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getSuccessStories(perPage: number = 12, page: number = 1): Observable<SuccessStory[]> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/success-stories?per_page=${perPage}&page=${page}`)
      .pipe(
        // فقط البيانات داخل الـ data
        map(response => response.data)
      );
  }
}

