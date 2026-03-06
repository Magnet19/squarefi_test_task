import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Список маршрутов, доступных без авторизации
const publicRoutes = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Легковесная проверка: есть ли какие-нибудь токены в куках
  // Proxy не валидирует JWT-подпись — только проверяет наличие cookie (правило §6)
  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("refresh_token");
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  const isPublicRoute = publicRoutes.includes(pathname);

  // Редирект с корня на dashboard или login
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && isAuthenticated) {
    // Авторизованный юзер не должен видеть /login
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute && !isAuthenticated) {
    // Неавторизованный юзер пытается зайти на закрытые страницы
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Matcher для proxy — ограничиваем обработку только нужными маршрутами
export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
