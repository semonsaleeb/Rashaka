import { Category } from "./Category";
import { Review } from "./Review";

export interface Product {
  category_id: number;
  id: number;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  stock: number;
  original_price?: string;
  price: string;         // string because it's "25.00" in quotes
  sale_price: string;    // same here
  cart_quantity: number;
  images: string[];
  categories: Category[];
  isFavorite?: boolean;  // optional if you're using a favorites system
  price_before: string;
  price_after: string;
average_rating?: number ;
 reviews?: Review[];
}
