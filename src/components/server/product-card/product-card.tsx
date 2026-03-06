import { AddToCartButton } from "@/components/client/add-to-cart-button/add-to-cart-button";
import { Card, CardTitle } from "@/components/ui/card";
import type { ProductCardProps } from "./product-card.types";

export function ProductCard({ product, userId }: ProductCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-1">
          <CardTitle className="text-sm">{product.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{product.description}</p>
        </div>
        <div className="flex items-center gap-4 md:ml-6">
          <p className="font-semibold text-sm">${product.price}</p>
          <AddToCartButton userId={userId} productId={product.id} />
        </div>
      </div>
    </Card>
  );
}
