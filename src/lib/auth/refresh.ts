import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getJwtMaxAge } from "@/lib/auth/jwt";
import { refreshResponseSchema } from "@/lib/api/types/auth.schema";

/**
 * Обновляет токены через refresh_token.
 *
 * Обёрнут в React cache() — гарантирует Single Refresh:
 * при параллельных запросах в рамках одного рендера HTTP-вызов к /auth/refresh
 * выполняется ровно один раз, остальные получают тот же результат.
 *
 * Изоляция между сессиями — автоматическая: cookies() читает куки
 * текущего HTTP-запроса, поэтому разные пользователи не пересекаются.
 *
 * Возвращает новый access token или null при неудаче.
 */
export const refreshTokens = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${env.API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken, expiresInMins: 30 }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json: unknown = await res.json();
    const parsed = refreshResponseSchema.safeParse(json);
    if (!parsed.success) return null;

    const { accessToken, refreshToken: newRefreshToken } = parsed.data;

    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getJwtMaxAge(accessToken) ?? 30 * 60,
    });

    cookieStore.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getJwtMaxAge(newRefreshToken) ?? 7 * 24 * 60 * 60,
    });

    return accessToken;
  } catch {
    return null;
  }
});

export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}
