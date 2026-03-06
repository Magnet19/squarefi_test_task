import "server-only";
import { apiFetch } from "@/lib/api/fetcher";
import { productsResponseSchema } from "@/lib/api/types/product.schema";
import type { ProductsResponse } from "@/lib/api/types/product.schema";

export async function getProducts(
  limit = 5,
  skip = 0,
): Promise<ProductsResponse> {
  return apiFetch(`/auth/products?limit=${limit}&skip=${skip}`, productsResponseSchema, {
    next: { revalidate: 60 },
  });
}
