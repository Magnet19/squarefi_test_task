import type { AddCartResponse } from "@/lib/api/types/cart.schema";

export interface AddToCartButtonProps {
  userId: number;
  productId: number;
  onCartAdded?: (cart: AddCartResponse) => void;
}
