import { Category } from "./Category";
import { Review } from "./Review";

export interface Product {
  category_id: number;
  id: number;
  name: string;
  name_ar?: string | null;
  description: string;
  description_ar: string;
  stock: number;
  original_price?: string | null;
  price?: string | null;
  sale_price?: string | null;
  cart_quantity: number | null;
  images: string[];
  categories: Category[];
  isFavorite?: boolean | null;
  price_before?: string | null;
  price_after?: string | null;
  average_rating?: number | null;
  reviews?: Review[] | null;
  is_top_seller: boolean;
}

