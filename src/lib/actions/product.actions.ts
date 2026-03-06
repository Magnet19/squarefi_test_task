"use server";

import { getProducts } from "@/lib/api/products";
import type { ActionResult } from "@/types";
import type { ProductsResponse } from "@/lib/api/types/product.schema";

export async function loadMoreProductsAction(
  skip: number,
  limit = 5,
): Promise<ActionResult<ProductsResponse>> {
  try {
    const data = await getProducts(limit, skip);
    return { success: true, data };
  } catch (error) {
    console.error("Load more products error:", error);
    const message = error instanceof Error ? error.message : "Не удалось загрузить продукты";
    return { success: false, error: message };
  }
}
