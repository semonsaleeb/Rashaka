// models/address.model.ts
export interface AddressData {
  location_type: string;
  coordinate: string;
  government_name?: string;
  city_name?: string;
  area_name?: string;
  street_name?: string;
  building_number?: string;
  apartment_number?: string;
  floor_number?: string;
  phone_number?: string;
  comment?: string;
}
