export interface CartViewItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  sale_unit_price: number;
  finalPrice: number;
  images: string[];
  price: string;
  description_ar?: string;
  sale_price: string;

  // الحقول الاختيارية
  nameAr?: string;
  product_name?: string;
  product_name_ar?: string;
  name_ar?: string;
  description?: string;
  // description_Ar?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  brandAr?: string;


}
