import { getMe } from "@/lib/api/user";
import { getProducts } from "@/lib/api/products";
import { getUserCarts } from "@/lib/api/carts";
import { DashboardHeader } from "@/components/server/dashboard-header/dashboard-header";
import { ProductList } from "@/components/client/product-list/product-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCTS_PER_PAGE } from "@/shared/constants";

export default async function DashboardPage() {
  const user = await getMe();

  const [cartsResult, productsResult] = await Promise.all([
    getUserCarts(user.id).catch((err: unknown) => {
      console.error("Failed to load carts:", err);
      return null;
    }),
    getProducts(PRODUCTS_PER_PAGE, 0).catch((err: unknown) => {
      console.error("Failed to load products:", err);
      return null;
    }),
  ]);

  return (
    <main className="max-w-6xl mx-auto min-h-screen p-6 space-y-6">
      <DashboardHeader user={user} />

      {/* User info */}
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Имя:</span> {user.firstName}{" "}
            {user.lastName}
          </p>
          <p>
            <span className="font-medium">Логин:</span> {user.username}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user.email}
          </p>
        </CardContent>
      </Card>

      {/* Carts (SSR) */}
      <Card>
        <CardHeader>
          <CardTitle>Корзины</CardTitle>
        </CardHeader>
        <CardContent>
          {cartsResult === null ? (
            <p className="text-destructive text-sm">
              Не удалось загрузить корзины
            </p>
          ) : cartsResult.carts.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {cartsResult.carts.map((cart) => (
                <li key={cart.id} className="border rounded p-3 space-y-1">
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

      {/* Products */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Продукты</h2>
        {productsResult ? (
          <ProductList
            initialProducts={productsResult.products}
            initialTotal={productsResult.total}
            userId={user.id}
          />
        ) : (
          <p className="text-destructive text-sm">
            Не удалось загрузить продукты
          </p>
        )}
      </div>
    </main>
  );
}
