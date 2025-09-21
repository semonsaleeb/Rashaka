interface FreeProductBalanceResponse {
  has_active_package: boolean;
  package: {
    id: number;
    name: string;
    type: string;
    start_date: string;
    end_date: string | null;
  };
  free_product_total: number;
  free_product_used: number;
  free_product_remaining: number;
}


interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}