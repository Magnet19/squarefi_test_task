import { getMe } from "@/lib/api/user";
import { getProducts } from "@/lib/api/products";
import { getUserCarts } from "@/lib/api/carts";
import { LogoutButton } from "@/components/client/logout-button";
import { ProductList } from "@/components/client/product-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  // Шаг 1: получаем пользователя (нужен userId для запроса корзин)
  const user = await getMe();

  // Шаг 2: загружаем корзины и продукты параллельно (правило §4 — Promise.all)
  const [cartsResult, productsResult] = await Promise.all([
    getUserCarts(user.id).catch((err: unknown) => {
      console.error("Failed to load carts:", err);
      return null;
    }),
    getProducts(5, 0).catch((err: unknown) => {
      console.error("Failed to load products:", err);
      return null;
    }),
  ]);

  return (
    <main className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>

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

      {/* Carts */}
      <Card>
        <CardHeader>
          <CardTitle>Корзины</CardTitle>
        </CardHeader>
        <CardContent>
          {cartsResult && cartsResult.carts.length > 0 ? (
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
            <p className="text-muted-foreground text-sm">
              {cartsResult ? "Корзины пусты" : "Не удалось загрузить корзины"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      <div className="space-y-3">
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
