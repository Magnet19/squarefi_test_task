import "server-only";
import { apiFetch } from "@/lib/api/fetcher";
import {
  userCartsResponseSchema,
  addCartResponseSchema,
} from "@/lib/api/types/cart.schema";
import type {
  UserCartsResponse,
  AddCartResponse,
} from "@/lib/api/types/cart.schema";

export async function getUserCarts(userId: number): Promise<UserCartsResponse> {
  return apiFetch(`/auth/carts/user/${userId}`, userCartsResponseSchema);
}

export async function addToCart(
  userId: number,
  productId: number,
  quantity = 1,
): Promise<AddCartResponse> {
  return apiFetch("/auth/carts/add", addCartResponseSchema, {
    method: "POST",
    body: JSON.stringify({
      userId,
      products: [{ id: productId, quantity }],
    }),
  });
}
