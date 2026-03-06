"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { addToCartAction } from "@/lib/actions/cart.actions";
import { Button } from "@/components/ui/button";
import type { AddToCartButtonProps } from "./add-to-cart-button.types";

export function AddToCartButton({ userId, productId }: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleAddToCart() {
    startTransition(async () => {
      const result = await addToCartAction(userId, productId);
      if (result.success) {
        toast.success("Товар добавлен в корзину");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button size="sm" onClick={handleAddToCart} disabled={isPending}>
      {isPending ? "Добавляем..." : "В корзину"}
    </Button>
  );
}
