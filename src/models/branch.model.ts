export interface City {
  id: number;
  name?: string;
  name_en?: string;
  name_ar?: string;
}

export interface Branch {
  id: number;
  name: string;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  city_id: number;
  city: City;
}
