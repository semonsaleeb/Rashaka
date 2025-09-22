// src/app/services/success-story.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SuccessStory } from '../../models/SuccessStory';
import { ClientReview } from '../../models/ClientReview';

// 👇 عرفهم هنا فوق الكلاس
export interface SuccessApiResponse {
  status: string;
  data: SuccessStory[];
}

export interface ReviewApiResponse {
  status: string;
  data: ClientReview[];
}

@Injectable({
  providedIn: 'root'
})
export class SuccessStoryService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // ✅ Success stories
  getSuccessStories(perPage: number = 12, page: number = 1): Observable<SuccessStory[]> {
    return this.http
      .get<SuccessApiResponse>(`${this.baseUrl}/success-stories?per_page=${perPage}&page=${page}`)
      .pipe(map(response => response.data));
  }

  // ✅ Client reviews
 getClientReviews(): Observable<ClientReview[]> {
  return this.http
    .get<ReviewApiResponse>(`${this.baseUrl}/client-reviews`)
    .pipe(
      map(response =>
        response.data.map(review => ({
          ...review,
          type: review.video_url.includes('youtube') ? 'youtube' : 'local'
        }))
      )
    );
}


}
