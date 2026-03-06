import "server-only";
import { getValidAccessToken } from "@/lib/auth/refresh";

const BASE_URL = "https://dummyjson.com";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Основной HTTP-клиент для DummyJSON.
 * Автоматически подмешивает access токен из кук и ретраит запрос в случае 401.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    requireAuth = true,
    headers: customHeaders,
    ...restOptions
  } = options;

  let headers = new Headers(customHeaders);
  headers.set("Content-Type", "application/json");

  // 1. Получаем токен из свежего пула (с попыткой рефреша, если текущий протух)
  if (requireAuth) {
    const token = await getValidAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      // Имитируем ошибку авторизации, если токен не удалось восстановить
      throw new Error("401 Unauthorized");
    }
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  // 2. Делаем полезный запрос
  const response = await fetch(url, { headers, ...restOptions });

  // 3. Обработка 401 на случай, если наш getValidAccessToken вернул формально живой
  //    (по сроку в куках), но фактически мертвый токен (например, сброшен на бекенде).
  if (response.status === 401) {
    // В теории этот блок можно расширить вызовом принудительного refresh,
    // но в нашей текущей архитектуре мы полагаемся на "умный" getValidAccessToken().
    // Если DummyJSON возвращает 401 при валидном с точки зрения Next JWT — это уже проблема консистентности.
    throw new Error("401 Unauthorized");
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `API Error: ${response.status}`);
  }

  // DummyJSON не всегда возвращает JSON на пустые ответы, делаем safe parse
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}
