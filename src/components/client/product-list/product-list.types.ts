import type { Product } from "@/lib/api/types/product.schema";

export interface ProductListProps {
  initialProducts: Product[];
  initialTotal: number;
  userId: number;
}
