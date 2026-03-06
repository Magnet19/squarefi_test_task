"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loadMoreProductsAction } from "@/lib/actions/product.actions";
import { AddToCartButton } from "@/components/client/add-to-cart-button/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/api/types/product.schema";
import type { ProductListProps } from "./product-list.types";

export function ProductList({
  initialProducts,
  initialTotal,
  userId,
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isPending, startTransition] = useTransition();

  const hasMore = products.length < initialTotal;

  function handleLoadMore() {
    startTransition(async () => {
      const result = await loadMoreProductsAction(products.length);
      if (result.success) {
        setProducts((prev) => [...prev, ...result.data.products]);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <div className="flex flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-1">
                <CardTitle className="text-sm">{product.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
              <div className="flex items-center gap-4 md:ml-6 justify-between">
                <p className="font-semibold text-sm">${product.price}</p>
                <AddToCartButton
                  userId={userId}
                  productId={product.id}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
            className="w-[136px]"
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Загрузить ещё"}
          </Button>
        </div>
      )}
    </div>
  );
}
