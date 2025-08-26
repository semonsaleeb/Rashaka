
export interface PlaceOrderResponse {
  status: string;
  message: string;
  order_id: number;
  address_id: number;
  payment_method: string;
  order_status: string;
  total_price: number;
  discount: number;
  promocode: string | null;
  items: any[];
}
