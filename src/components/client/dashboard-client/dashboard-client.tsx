"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductList } from "@/components/client/product-list/product-list";
import type { Cart, AddCartResponse } from "@/lib/api/types/cart.schema";
import type { DashboardClientProps } from "./dashboard-client.types";

type CartEntry = { key: number; cart: Cart };

export function DashboardClient({
  initialCarts,
  initialProducts,
  initialTotal,
  userId,
}: DashboardClientProps) {
  const keyRef = useRef(0);
  const [carts, setCarts] = useState<CartEntry[]>(() =>
    initialCarts.map((cart) => ({ key: keyRef.current++, cart })),
  );

  function handleCartAdded(cart: AddCartResponse) {
    setCarts((prev) => [...prev, { key: keyRef.current++, cart }]);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Корзины</CardTitle>
        </CardHeader>
        <CardContent>
          {carts.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {carts.map(({ key, cart }) => (
                <li key={key} className="border rounded p-3 space-y-1">
                  <p className="font-medium">Корзина #{cart.id}</p>
                  <p className="text-muted-foreground">
                    Товаров: {cart.totalProducts} · Итого: $
                    {cart.total.toFixed(2)} (со скидкой: $
                    {cart.discountedTotal.toFixed(2)})
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Корзины пусты</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Продукты</h2>
        <ProductList
          initialProducts={initialProducts}
          initialTotal={initialTotal}
          userId={userId}
          onCartAdded={handleCartAdded}
        />
      </div>
    </>
  );
}
