/**
 * Стандартный тип результата для Server Actions.
 * error — всегда string, не Error-объект (правило §2).
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Re-export types from zod schemas — single source of truth
export type { User, AuthResponse } from "@/lib/api/types/auth.schema";
export type { Product, ProductsResponse } from "@/lib/api/types/product.schema";
export type { Cart, UserCartsResponse, AddCartResponse } from "@/lib/api/types/cart.schema";
