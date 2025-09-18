import { CartItem } from "./CartItem";

// export interface CartResponse {
//   items: CartItem[];
//   cart_total: number;       // إجمالي قبل الخصم
//   sale_cart_total: number;  // إجمالي بعد الخصم
//   totalQuantity: number;
//    discount_value?: string;
// }

export interface CartResponse {
  items: CartItem[];
  cart_total: string | number;
  sale_cart_total: string | number;
  discount_value?: string | number;
  top_sellers?: any[];
  totalQuantity?: number; // optional (ممكن نحسبه عندنا)
}

// export interface CartResponse {
//   items: CartItem[];
//   discount_value: string;
//   cart_total: string;
//   sale_cart_total: string;
//   top_sellers: any[];
//   totalQuantity?: number;
// }
