import type { Product } from "@/lib/api/types/product.schema";
import { AddToCartButton } from "@/components/client/add-to-cart-button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProductCardProps {
  product: Product;
  userId: number;
}

export function ProductCard({ product, userId }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm line-clamp-2">{product.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="font-semibold">${product.price}</p>
        <p className="text-muted-foreground line-clamp-2">
          {product.description}
        </p>
      </CardContent>
      <CardFooter>
        <AddToCartButton userId={userId} productId={product.id} />
      </CardFooter>
    </Card>
  );
}
