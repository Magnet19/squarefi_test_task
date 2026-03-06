import { z } from "zod";

const cartProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  quantity: z.number(),
  total: z.number(),
  discountPercentage: z.number(),
  discountedTotal: z.number().optional(),
  discountedPrice: z.number().optional(),
  thumbnail: z.string(),
});

export const cartSchema = z.object({
  id: z.number(),
  products: z.array(cartProductSchema),
  total: z.number(),
  discountedTotal: z.number(),
  userId: z.number(),
  totalProducts: z.number(),
  totalQuantity: z.number(),
});

export const userCartsResponseSchema = z.object({
  carts: z.array(cartSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

export const addCartResponseSchema = z.object({
  id: z.number(),
  products: z.array(cartProductSchema),
  total: z.number(),
  discountedTotal: z.number(),
  userId: z.number(),
  totalProducts: z.number(),
  totalQuantity: z.number(),
});

export type Cart = z.infer<typeof cartSchema>;
export type UserCartsResponse = z.infer<typeof userCartsResponseSchema>;
export type AddCartResponse = z.infer<typeof addCartResponseSchema>;
