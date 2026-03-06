import "server-only";
import type { ZodType } from "zod";
import { getValidAccessToken } from "@/lib/auth/refresh";
import { env } from "@/lib/env";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Основной HTTP-клиент для DummyJSON.
 * Автоматически подмешивает access токен из кук и возвращает ошибку при 401.
 *
 * @param schema — zod-схема для валидации ответа (правило §6 — валидация внешних данных)
 */
export async function apiFetch<T>(
  endpoint: string,
  schema: ZodType<T>,
  options: FetchOptions = {},
): Promise<T> {
  const {
    requireAuth = true,
    headers: customHeaders,
    cache = "no-store", // Правило §3 — авторизованные данные не кешировать
    ...restOptions
  } = options;

  const headers = new Headers(customHeaders);
  headers.set("Content-Type", "application/json");

  // 1. Получаем токен из свежего пула (с попыткой рефреша, если текущий протух)
  if (requireAuth) {
    const token = await getValidAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      throw new Error("401 Unauthorized");
    }
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${env.API_BASE_URL}${endpoint}`;

  // 2. Делаем запрос
  const response = await fetch(url, { headers, cache, ...restOptions });

  // 3. Обработка 401
  if (response.status === 401) {
    throw new Error("401 Unauthorized");
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `API Error: ${response.status}`);
  }

  // 4. Парсим и валидируем ответ через zod-схему (правило §3, §6)
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    console.error("API response validation failed:", parsed.error.flatten());
    throw new Error("API response validation failed");
  }

  return parsed.data;
}
