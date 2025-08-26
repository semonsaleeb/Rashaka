
export interface PromoResponse {
  success: boolean;
  original_total: number;
  discount_amount: number;
  new_total: number;
  promocode: string;
}