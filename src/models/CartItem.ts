// export interface CartItem {
//   id?: number;
//   product_id: number;
//   product_name?: string;
//   product_name_ar?: string;
//   name?: string;
//   name_ar?: string;
//   description?: string;
//   image?: string;
//   images?: string[];

//   price?: string;
//   sale_price?: string | null;
//   unit_price?: string;
//   sale_unit_price?: string;
//   final_price?: string;
//   line_total?: number;
//   total_price?: string;
//   total_sale_price?: string;
//   description_ar?: string;
//   quantity: number;
//   stock_quantity?: number;
//   stock?: number;
//   isFavorite?: boolean;
//    unit_price_after_offers?: string; 
//    total_price_after_offers?: string; 
// }

export interface CartItem {
  id?: number;
  product_id: number;
  product_name: string;
  product_name_ar?: string;
images?: string[];
  // اللي راجع من الـ API
  unit_price?: string | number;
  // sale_unit_price?: number;
  sale_unit_price?: number;
  price?: string | number;
  sale_price?:  number;
  total_price?: string | number;
  total_price_after_offers?: string | number;
 quantity: number;
 stock_quantity?: number;
  // اللي ضفتهم إنت في processCartItems
  unitPrice?: number;
  saleUnitPrice?: number;
  totalPrice?: number;
  totalPriceAfterOffers?: number;
  nameAr?: string;
  image?: string;
  final_price?: string;
  unit_price_after_offers?:string;
  total_sale_price?: string;
}
