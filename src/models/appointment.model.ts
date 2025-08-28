// models/appointment.model.ts
export interface City {
  id: number | null;
  name: string;
  name_ar: string;
}

export interface Center {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  city: City;
}

export interface Specialist {
  id: number;
  name: string;
  image?: string;
}

export interface Appointment {
  id: number;
  center_id?: number;
  specialist_id?: number;
  specialist_name?: string;
  date: string;
  start: string;
  end?: string;
  duration_minutes?: number;
  status: string;
  session_type_key?: string | null;
  payment_method?: string | null;
  is_paid?: boolean;
  center?: Center;
  specialist?: Specialist;
  type?: string;
  name?: string | null;
  start_at?: string;
  end_at?: string;
}


export interface WorkingHour {
  day: string;   // اسم اليوم (مثلاً الأحد)
  start: string;
  end: string;
}
