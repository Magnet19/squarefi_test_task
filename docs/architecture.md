# Архитектура проекта Next.js E-Commerce

## 1. Структура проекта

Проект строится на базе Next.js 16.1.6, App Router, все запросы к внешнему API идут исключительно с сервера.

```text
src/
├── app/                  # Слои роутинга и страницы (Server Components по умолчанию)
│   ├── (auth)/           # Группа маршрутов для публичной зоны
│   │   └── login/        # Страница авторизации
│   ├── dashboard/        # Защищенная зона (Dashboard)
│   │   └── page.tsx      # RSC для рендеринга продуктов
│   └── page.tsx          # Root-редирект (в dashboard или login)
├── components/           # UI-компоненты (построены на базе shadcn/ui)
│   ├── server/           # Серверные компоненты (переиспользуемые части без стейта)
│   └── client/           # Клиентские компоненты ("use client" - формы, кнопки)
├── lib/                  # Ядро бизнес-логики
│   ├── api/              # Изолированный клиент для DummyJSON (работает только на Node.js)
│   ├── auth/             # Логика refresh-токена, контроль сессий (работа с cookies)
│   └── utils/            # Вспомогательные функции, валидация сторонних данных
├── actions/              # Server Actions (мутации: login, add-to-cart)
├── types/                # TypeScript интерфейсы (API responses, внутренние модели)
├── proxy.ts              # Защита страниц (узел перехвата на Node.js, замена middleware)
└── error.tsx             # Глобальный Error Boundary
```

Назначение слоев:

- **API-клиент (`lib/api`)**: Абстракция над DummyJSON API. Все `fetch` обернуты именно здесь. Не импортируется в клиентские компоненты.
- **Server Actions (`actions/`)**: Прослойка между клиентскими событиями (submit формы, клик) и серверным API-клиентом.
- **Components**: Разделение на smart (могут вызывать actions) и dumb.

## 2. Аутентификация и управление токенами

**Хранение токенов:**

- И `access_token`, и `refresh_token` записываются сервером в **httpOnly cookies**. Флаги: `Secure` (для продакшена), `SameSite=Lax`, `Path=/`.
- _Обоснование:_ Полностью защищает от XSS (скрипт не может прочесть токен). А так как прямого взаимодействия браузер → DummyJSON нет, токенам не нужно находиться на клиенте.

**Механизм автоматического refresh:**

- При любом запросе из Server Component или Server Action к API-клиенту подставляется `access_token` из `cookies()`.
- Если DummyJSON возвращает `401 Unauthorized`, API-клиент перехватывает ответ, берет `refresh_token` из cookies, делает запрос на обauth/refresh (DummyJSON).
- В случае успеха -> обновляет cookies через серверный контекст, повторяет оригинальный запрос.
- В случае провала -> очищает cookies, бросает кастомную ошибку (или редиректит на `/login`).

**Single-refresh и изоляция сессий:**

- Т.к. refresh вызывается в Node.js окружении (где обрабатываются запросы сотен юзеров), мы не можем использовать глобальный boolean флаг `isRefreshing`.
- _Решение:_ Используется паттерн `Promise Dictionary` уровня модуля, где ключом выступает сам **refresh_token** (или ID сессии).
  ```typescript
  const refreshPromises = new Map<string, Promise<string>>(); // key: refreshToken
  ```
- Если приходят конкурентные запросы (например, рендерится 3 серверных компонента параллельно, и у всех протух токен), каждый из них проверяет `refreshPromises.get(currentRefreshToken)`. Первый запрос инициирует fetch, остальные ждут его разрешения, что гарантирует **только один** внешний запрос на каждый токен, без смешивания контекстов других пользователей.

**Proxy (`proxy.ts` - нововведение Next.js 16):**

- Заменяет `middleware.ts` и работает на **Node.js runtime**, а не Edge. Выполняет легковесную проверку: есть ли куки с токенами.
- Если юзер без токенов ломится на `/dashboard` -> редирект на `/login`.
- Если юзер с токеном заходит на `/login` или `/` -> редирект на `/dashboard`.

## 3. API-слой

**Архитектура API-клиента (`lib/api/fetcher.ts`):**

- Обертка `apiFetch<T>(endpoint, options)`, которая инкапсулирует базовый URL DummyJSON.
- Встроенная оркестрация получения кук (`next/headers()`) и логика refresh (через модуль `lib/auth/refresh.ts`).
- Запрет на использование `apiFetch` внутри "use client" (проверка через `"server-only"` package).

**Типизация:**

- Создаем схемы Zod или TS-интерфейсы в `types/` для строгой проверки контрактов DummyJSON (Products Response, Auth Response).

## 4. Серверные и клиентские компоненты

- **Серверные (RSC):**
  - Абсолютно вся загрузка данных идет в них. Страница `app/dashboard/page.tsx` асинхронно вызывает `apiFetch('/products?limit=...')` и строит HTML на сервере.
  - Используем директиву `"use cache"` из Next.js 16 для явного кэширования ресурсоемких функций или целых компонентов (Cache Components).
  - _Обоснование:_ Скрывает логику от клиента, обеспечивает zero-JS доставку контента и мгновенный LCP.
- **Клиентские (RSC Leaves):**
  - Форма авторизации (`components/client/login-form.tsx`), пагинатор (связан с роутером или стейтом), карточка товара ("Добавить в корзину").
  - Клиентские компоненты общаются с DummyJSON не напрямую, а вызывая импортированные функции из `actions/` (Server Actions).
  - **Стейт UI (например, корзина):** Мы _не используем_ глобальные стейт-менеджеры (Zustand/Redux). Кнопка "В корзину" вызывает Server Action, который делает POST-запрос к API и вызывает `revalidatePath` или `revalidateTag`. Next.js автоматически обновляет UI свежими данными с сервера без клиентского стейта.

## 5. Обработка ошибок

- **Серверная сторона:** Server Actions обернуты в try-catch и используют паттерн `Result<T, E>` (например `type Result<T, E> = { success: true, data: T } | { success: false, error: E }`). Никаких выбросов `throw new Error` наружу, чтобы избежать "Uncaught Exception" на UI.
- **Клиентская сторона:**
  - Глобальная система тостов (`sonner`).
  - Компоненты используют возвращаемые из Server Actions объекты (через `useActionState` или `useTransition`) для показа спиннеров и уведомлений об ошибке.
  - Если на сервере падает SSR (например 500 от внешнего API), срабатывает `error.tsx` компонента, показывая fallback-интерфейс "Что-то пошло не так".

## 6. Безопасность

- **Запрет доступа к API:** Пакет `server-only` на всех файлах `lib/api`, чтобы они случайно не попали в клиентский бандл.
- **XSS/CSRF:** Токены только в `httpOnly` куках, Server Actions защищены нативным POST-validation Next.js (Origin/Host чеки).
- **Валидация мутаций:** Полная Zod-валидация email/password на сервере (`actions/auth.ts`) перед отправкой на DummyJSON.

## 7. План запуска и файлы к реализации

Порядок, в котором следует разрабатывать проект:

1. **Базовый сетап & Безопасность:**
   - `types/dummyjson.ts` (Интерфейсы)
   - `lib/api/fetcher.ts` (Core HTTP клиент с проверкой статусов)
   - `lib/auth/refresh.ts` (Реализация Single-Refresh Promise Dictionary)
2. **Аутентификация & Роутинг:**
   - `proxy.ts` (Защита URL на уровне Node.js)
   - `actions/auth.ts` (Логин/Логаут мутации, установка httpOnly кук)
   - `app/(auth)/login/page.tsx` + `components/client/login-form.tsx`
3. **Dashboard & Продукты:**
   - `app/dashboard/page.tsx` (Серверная выборка продуктов с поддержкой `?page=X`)
   - `components/server/product-card.tsx` (Отображение)
   - `components/client/pagination.tsx` (Генерация URL через `usePathname`/`useSearchParams`)
4. **Взаимодействие с корзиной:**
   - `actions/cart.ts` (Добавление в корзину)
   - `components/client/add-to-cart-button.tsx` (Вызов action + toast-нотификация)
