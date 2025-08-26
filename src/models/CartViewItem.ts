// src/app/models/cart.models.ts

export interface CartViewItem {
  id: number;
  product_id: number;
  name?: string;
  name_ar?: string;

  // أسماء مختلفة حسب API أو العرض
  product_name?: string;
  product_name_ar?: string;
  nameAr?: string;

  description?: string;
  description_ar?: string;

  // الأسعار
  price?: string;
  unit_price?: string;
  sale_price?: string | null;
  sale_unit_price?: string;
  final_price?: string;   // API
  finalPrice?: number;    // UI (محسوبة)

  // صور
  image?: string;
  images?: string[];

  // الكمية
  quantity?: number;
  line_total?: number;
  total_price?: string;
  total_sale_price?: string;

  // بيانات إضافية
  sku?: string;
  barcode?: string;
  brand?: string;
  brandAr?: string;
  stock_quantity?: number;
  stock?: number;
  isFavorite?: boolean;
}




