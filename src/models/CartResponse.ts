import { CartItem } from "./CartItem";

export interface CartResponse {
  items: CartItem[];
  cart_total: number;       // إجمالي قبل الخصم
  sale_cart_total: number;  // إجمالي بعد الخصم
  totalQuantity: number;
}

