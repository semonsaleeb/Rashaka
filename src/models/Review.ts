export interface Review {
  id: number;
  client_name: string;
  client_id: number;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}