export interface Plan {
  id: number;
  type: string;
  title: string;
  price: number;
  sessions: number;
  cities: string;
  features: string[];
  styleType: 'basic' | 'premium' | 'standard';
}
