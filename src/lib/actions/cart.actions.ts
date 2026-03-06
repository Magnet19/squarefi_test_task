"use server";

import { addToCart } from "@/lib/api/carts";
import type { ActionResult } from "@/types/dummyjson";
import type { AddCartResponse } from "@/lib/api/types/cart.schema";

export async function addToCartAction(
  userId: number,
  productId: number,
): Promise<ActionResult<AddCartResponse>> {
  try {
    const data = await addToCart(userId, productId);
    return { success: true, data };
  } catch (error) {
    console.error("Add to cart error:", error);
    return { success: false, error: "Не удалось добавить товар в корзину" };
  }
}
