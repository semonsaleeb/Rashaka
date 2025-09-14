export interface Feature {
  type: string;
  text_ar: string;
  text_en: string;
}

export interface City {
  name: string;
  name_ar: string;
}

export interface ActiveOffer {
  id: number;
  discount_type: 'fixed' | 'percent';
  discount_value: string; // أو number لو عايز تتأكد من العمليات الحسابية
  start_date: string;     // ممكن تحوّله لـ Date لاحقًا
  end_date: string;
  type: string;
}

export interface Plan {
  id: number;
  type: string;
  title: string;
  price_before?: string;
  price_after?: number;
  sessions: string;
  features: Feature[]; 
  cities: City[];
  styleType: 'basic' | 'premium' | 'standard';
  active_offer?: {
    id: number;
    discount_type: string;
    discount_value: string;
    start_date: string;
    end_date: string;
  };
}
