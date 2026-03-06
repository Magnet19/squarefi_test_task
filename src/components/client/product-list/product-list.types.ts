import type { Product } from "@/lib/api/types/product.schema";
import type { AddCartResponse } from "@/lib/api/types/cart.schema";

export interface ProductListProps {
  initialProducts: Product[];
  initialTotal: number;
  userId: number;
  onCartAdded?: (cart: AddCartResponse) => void;
}
