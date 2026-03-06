import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://dummyjson.com";

// Список маршрутов, доступных без авторизации
const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isAuthenticated = !!(accessToken || refreshToken);

  const isPublicRoute = publicRoutes.includes(pathname);

  // Редирект с корня на dashboard или login
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Если на защищённом маршруте нет access_token, но есть refresh_token —
  // пробуем обновить токены прямо в proxy (единственное место где можно писать куки)
  if (!isPublicRoute && !accessToken && refreshToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken, expiresInMins: 30 }),
      });

      if (!res.ok) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("refresh_token");
        return response;
      }

      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };

      if (!data.accessToken || !data.refreshToken) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("refresh_token");
        return response;
      }

      const secure = process.env.NODE_ENV === "production";
      const response = NextResponse.next();

      response.cookies.set("access_token", data.accessToken, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60,
      });

      response.cookies.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Matcher для proxy — ограничиваем обработку только нужными маршрутами
export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
