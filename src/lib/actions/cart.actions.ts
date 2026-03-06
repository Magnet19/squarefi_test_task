"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { addToCart } from "@/lib/api/carts";
import type { ActionResult } from "@/types";
import type { AddCartResponse } from "@/lib/api/types/cart.schema";

const addToCartSchema = z.object({
  userId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

export async function addToCartAction(
  userId: number,
  productId: number,
): Promise<ActionResult<AddCartResponse>> {
  const parsed = addToCartSchema.safeParse({ userId, productId });
  if (!parsed.success) {
    return { success: false, error: "Некорректные данные запроса" };
  }

  try {
    const data = await addToCart(parsed.data.userId, parsed.data.productId);
    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (error) {
    console.error("Add to cart error:", error);
    return { success: false, error: "Не удалось добавить товар в корзину" };
  }
}
