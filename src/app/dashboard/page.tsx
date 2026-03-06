import { getMe } from "@/lib/api/user";
import { getProducts } from "@/lib/api/products";
import { getUserCarts } from "@/lib/api/carts";
import { DashboardHeader } from "@/components/server/dashboard-header/dashboard-header";
import { DashboardClient } from "@/components/client/dashboard-client/dashboard-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRODUCTS_PER_PAGE = 5;

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

      {productsResult ? (
        <DashboardClient
          initialCarts={cartsResult?.carts ?? []}
          initialProducts={productsResult.products}
          initialTotal={productsResult.total}
          userId={user.id}
        />
      ) : (
        <>
          {/* Carts (static fallback when products failed) */}
          <Card>
            <CardHeader>
              <CardTitle>Корзины</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {cartsResult
                  ? cartsResult.carts.length > 0
                    ? `${cartsResult.carts.length} корзин`
                    : "Корзины пусты"
                  : "Не удалось загрузить корзины"}
              </p>
            </CardContent>
          </Card>
          <p className="text-destructive text-sm">
            Не удалось загрузить продукты
          </p>
        </>
      )}
    </main>
  );
}
