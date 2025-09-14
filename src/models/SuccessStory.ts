// src/app/models/success-story.model.ts
export interface SuccessStory {
  id: number;
  client_id: number | null;
  client_name: string;
  before_image: string;
  after_image: string;
  before_weight: string;
  after_weight: string;
  weight_change: number;
  story: string;
  created_at: string;
}
