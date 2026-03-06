import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Список маршрутов, доступных без авторизации
const publicRoutes = ["/login"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем статику и API роуты
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Легковесная проверка: есть ли какие-нибудь токены в куках
  // Углубленную валидацию будет делать fetcher на уровне RSC
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
