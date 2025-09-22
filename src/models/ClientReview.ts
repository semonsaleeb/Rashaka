// export interface ClientReview {
//   id: number;
//   client_name: string;
//   description: string;
//   video_url: string;
//   created_at: string;
//   updated_at: string;
//     type: 'youtube' | 'local'; 
// }
export interface ClientReview {
  id: number;
  client_name: string;
  description: string;
  video_url: string;
  created_at: string;
  updated_at: string;

  // 👇 هنضيف دول محلياً
  type?: 'youtube' | 'local';
}
