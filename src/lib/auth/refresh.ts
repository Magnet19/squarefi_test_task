import "server-only";
import { cookies } from "next/headers";
import type { AuthResponse } from "@/types/dummyjson";

const refreshPromises = new Map<string, Promise<string>>();

export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    return accessToken;
  }

  // Если access_token нет, возможно он протух, проверяем refresh_token
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) {
    return null;
  }

  // Запускаем механизм единичного рефреша
  return refreshAccessToken(refreshToken);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  // 1. Проверяем, не запущено ли уже обновление этого токена кем-то другим
  if (refreshPromises.has(refreshToken)) {
    return refreshPromises.get(refreshToken)!;
  }

  // 2. Инициируем запрос и сохраняем промис
  const requestPromise = fetch("https://dummyjson.com/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: refreshToken,
      expiresInMins: 30, // Выставляем 30 минут, хотя DummyJSON это игнорирует иногда
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const data: AuthResponse = await res.json();

      // 3. Сохраняем свежие токены
      const cookieStore = await cookies();

      cookieStore.set("access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        // Не задаем expires в куки, чтобы она была сессионной,
        // либо можно достать JWT срок действия. Для простоты установим 30 мин:
        maxAge: 30 * 60,
      });

      cookieStore.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 дней
      });

      return data.accessToken;
    })
    .catch(async (error) => {
      // В случае ошибки прибиваем плохие куки (чтобы юзера выкинуло на login)
      const cookieStore = await cookies();
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      return null;
    })
    .finally(() => {
      // 4. После завершения (успех или провал), удаляем промис из словаря
      refreshPromises.delete(refreshToken);
    });

  refreshPromises.set(refreshToken, requestPromise);
  return requestPromise;
}
