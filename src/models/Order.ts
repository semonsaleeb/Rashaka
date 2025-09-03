export interface OrderItem {
  product_id: number;
  product_name: string;
  product_name_ar?: string;
  product_images?: string[]; // ممكن يرجع أكتر من صورة
  quantity: number;
  price: number | string;
  total_price?: number | string;
  image?: string; // لو عايز تختار صورة واحدة بس من product_images
}

export interface Order {
  order_id: number;
  status: string;
  total_price: number | string;
  payment_method: string;
  created_at: string;
  items?: OrderItem[];
}
