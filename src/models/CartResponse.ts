import { CartItem } from "./CartItem";

export interface CartResponse {
  items: CartItem[];
  totalPrice: number;
  totalQuantity: number;
  totalSalePrice?: number;
}