"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { loadMoreProductsAction } from "@/lib/actions/product.actions";
import { AddToCartButton } from "@/components/client/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/api/types/product.schema";

interface ProductListProps {
  initialProducts: Product[];
  initialTotal: number;
  userId: number;
}

export function ProductList({ initialProducts, initialTotal, userId }: ProductListProps) {
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-sm line-clamp-2">{product.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-semibold">${product.price}</p>
              <p className="text-muted-foreground line-clamp-2">{product.description}</p>
            </CardContent>
            <CardFooter>
              <AddToCartButton userId={userId} productId={product.id} />
            </CardFooter>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? "Загрузка..." : "Загрузить ещё"}
          </Button>
        </div>
      )}
    </div>
  );
}
