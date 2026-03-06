# Архитектура проекта Next.js E-Commerce

## 1. Структура проекта

Проект строится на базе Next.js 16.1.6, App Router. Прямое взаимодействие браузер → DummyJSON API **запрещено**. Запросы к внешнему API идут исключительно с сервера.

```text
src/
├── app/                  # Слои роутинга и страницы (Server Components по умолчанию)
│   ├── (auth)/           # Группа маршрутов для публичной зоны
│   │   └── login/        # Страница авторизации
│   ├── dashboard/        # Защищенная зона (Dashboard)
│   │   └── page.tsx      # RSC для рендеринга продуктов, корзин, профиля (Promise.all)
│   ├── error.tsx         # Глобальный Error Boundary
│   └── page.tsx          # Root-редирект (в dashboard или login)
├── components/           # UI-компоненты (построены на базе shadcn/ui)
│   ├── server/           # Серверные компоненты (переиспользуемые части без стейта)
│   └── client/           # Клиентские компоненты ("use client", используется точечно)
├── lib/                  # Ядро бизнес-логики
│   ├── api/              # Изолированный клиент для DummyJSON, fetcher.ts (`server-only`)
│   │   └── types/        # Zod-схемы и TypeScript типы, выведенные через z.infer
│   ├── auth/             # Логика refresh-токена, контроль сессий (работа с httpOnly cookies)
│   ├── actions/          # Server Actions (мутации: auth.actions.ts, cart.actions.ts)
│   └── utils/            # Вспомогательные функции
├── proxy.ts              # Защита страниц на сетевом уровне (Node.js runtime, замена middleware)
└── next.config.ts        # Конфигурация с HTTP заголовками безопасности
```

Назначение слоев:

- **API-клиент (`lib/api`)**: Абстракция над DummyJSON API. Файлы помечены `import 'server-only'`.
- **Server Actions (`lib/actions/`)**: Прослойка мутаций. Все мутации (submit формы, добавление в корзину) проходят через экшены, с их валидацией на Zod и возвратом `ActionResult`.
- **Components**: Строгое разделение. `"use client"` ставится только там, где реально нужна интерактивность. Нет barrel-файлов (`index.ts` с реэкспортом). Импорты абсолютные через `@/`.

## 2. Аутентификация и управление токенами

**Хранение токенов:**

- Токены хранятся **сугубо** в `httpOnly` cookies (`Secure`, `SameSite=Lax`, `Path=/`).
- Токены никогда не передаются на клиент (в пропсы, `searchParams` и т.д).

**Механизм автоматического refresh (Single-Refresh):**

- При 401 Unauthorized API-клиент прозрачно для юзера вызывает функцию refresh.
- Параллельные вызовы дедуплицируются с помощью **одного модульного промиса** (`let refreshPromise: Promise<string> | null = null;`), без использования Map или ключей.
- Изоляция сессий обеспечивается на уровне cookies (каждый запрос уже несёт cookies конкретного пользователя).

**Proxy (`proxy.ts` - маршрутизатор):**

- Заменяет `middleware.ts`, работает на Node.js.
- Экспортирует функцию `proxy()` для проверки наличия токена. Без валидации подписи. Редиректит на `/login` (если доступ закрыт) или `/dashboard` (если уже авторизован).

## 3. API-слой

**Архитектура API-клиента (`lib/api/fetcher.ts`):**

- Защищен `import 'server-only'`.
- Содержит единую функцию `apiFetch`, которая привязывает Bearer token из cookies и оркестрирует retry при 401.
- Запрет на кэширование авторизованных данных: запросы к `/auth/*` всегда делаются с `cache: 'no-store'`.

**Типизация `lib/api/types/`:**

- Строгая Zod-валидация для входящих ответов от DummyJSON.
- TS-Типы не пишутся вручную, если есть валидация, а выводятся через `z.infer`.

## 4. Серверные и клиентские компоненты

**Серверные (RSC):**

- Точка сборки данных: `app/dashboard/page.tsx`. Осуществляет параллельный запрос (`Promise.all`) для получения пользователя (`/auth/me`), его корзин и продуктов.
- Это предотвращает waterfall-загрузку. Могут независимо упасть и быть обработаны.

**Клиентские (RSC Leaves):**

- Клиентские формы вызывают Server Actions.
- Используем `useTransition` или `useActionState` для обработки `isPending` без ручного стейта (loading spinner для кнопки).
- Оптимистичный UI не применяется — просто ждём загрузки и выводим ответ/результат.

## 5. Обработка ошибок

- **Server Actions:** Не используют `throw`! Всегда возвращается `Result` объект:
  `type ActionResult<T> = { success: true; data: T } | { success: false; error: string };`
- Внешние данные (формы, query string, proxy) валидируются через Zod до исполнения логики.
- Пользователь видит понятные Toasts ("Не удалось добавить товар") вместо серверных stack traces. Технические детали уходят в `console.error`.
- Error Boundaries (`error.tsx`) служат как "последний рубеж" для SSR и непредвиденных исключений со сломанными интерфейсами.

## 6. Безопасность

- Включены HTTP заголовки безопасности в `next.config.ts` (`X-Frame-Options`, `X-Content-Type-Options` и др).
- Строгий `server-only` на модулях с токенами и API.
- Встроенная XSS/CSRF защита (за счет `httpOnly` кук и нативного CSRF-протектора Next.js от Server Actions).
- Typescript strict type checking (`"strict": true` в конфигурации, без отбрасывания типов через `as`, `import type {}` для типов).

## 7. План запуска и файлы к реализации

1. **Базовый сетап & Безопасность:**
   - Настройка `tsconfig.json`, `next.config.ts`, алиасов `@/`.
   - `lib/api/types/*.schema.ts` (Zod Схемы и `z.infer` типы)
   - `lib/api/fetcher.ts` (Core HTTP клиент с проверкой статусов, "server-only")
   - `lib/auth/refresh.ts` (Простая переменная refreshPromise модуля)
2. **Аутентификация & Роутинг:**
   - `proxy.ts` (Защита URL, работает на Node.js)
   - `lib/actions/auth.actions.ts` (Логин/Логаут мутации с возвратом ActionResult)
   - `app/(auth)/login/page.tsx` + `components/client/login-form.tsx` (используем useTransition/useActionState)
3. **Dashboard & Продукты:**
   - `app/dashboard/page.tsx` (Серверная выборка `Promise.all` для пользователя, корзины, продуктов)
   - `components/server/product-card.tsx`
   - `components/client/pagination.tsx`
4. **Взаимодействие с корзиной:**
   - `lib/actions/cart.actions.ts` (Добавление в корзину с возвратом ActionResult)
   - `components/client/add-to-cart-button.tsx` (Вызов мутации + Sonner toast нотификация)
