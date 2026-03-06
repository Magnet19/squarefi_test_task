import type { Cart } from "@/lib/api/types/cart.schema";
import type { Product } from "@/lib/api/types/product.schema";

export interface DashboardClientProps {
  initialCarts: Cart[];
  initialProducts: Product[];
  initialTotal: number;
  userId: number;
}
