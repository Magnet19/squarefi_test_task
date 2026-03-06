import type { Product } from "@/lib/api/types/product.schema";

export interface ProductCardProps {
  product: Product;
  userId: number;
}
