export interface CartItem {
  id?: number;
  product_id: number;
  product_name?: string;
  product_name_ar?: string;
  name?: string;
  name_ar?: string;
  description?: string;
  image?: string;
  images?: string[];

  price?: string;
  sale_price?: string | null;
  unit_price?: string;
  sale_unit_price?: string;
  final_price?: string;
  line_total?: number;
  total_price?: string;
  total_sale_price?: string;
  description_ar?: string;
  quantity: number;
  stock_quantity?: number;
  stock?: number;
  isFavorite?: boolean;
}