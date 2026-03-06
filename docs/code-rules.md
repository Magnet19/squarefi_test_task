# Code Rules: Архитектура, безопасность, производительность

---

## 1. Серверная изоляция (Security — критично)

### Правило: server-only boundary

- Любой файл, который работает с cookies, токенами или обращается к DummyJSON API, **обязан** содержать `import 'server-only'` на первой строке (после директив)
- Это касается: `lib/api/fetcher.ts`, `lib/auth/tokens.ts`, `lib/auth/session.ts`, все Server Actions
- Нарушение: если клиентский компонент импортирует такой файл — сборка упадёт. Это ожидаемое поведение, не баг

### Правило: нет прямых запросов к DummyJSON с клиента

- Клиентские компоненты **никогда** не вызывают `fetch('https://dummyjson.com/...')`
- Клиент взаимодействует с данными только через: Server Actions, серверные компоненты (пропсы сверху), Route Handlers (если необходимо)

### Правило: не передавать токены на клиент

- Токены (access, refresh) **никогда** не попадают в пропсы компонентов, в `searchParams`, в URL, в `data-` атрибуты
- Токены живут только в httpOnly cookies и серверном коде

---

## 2. Server Actions

### Правило: файловая организация

- Server Actions живут в `lib/actions/`, не внутри компонентов
- Каждый файл начинается с `"use server"`
- Группировка по домену: `auth.actions.ts`, `cart.actions.ts`, `product.actions.ts`

### Правило: возвращаемый тип — всегда Result

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

- **Никогда не throw** из Server Actions — это крашит клиентский UI через Error Boundary
- Все ошибки ловятся внутри Action и возвращаются как `{ success: false, error: message }`
- На клиенте: проверка `result.success`, показ toast при ошибке

### Правило: валидация входных данных

- Все входные данные Server Actions валидируются через `zod` до выполнения логики
- Никогда не доверять данным от клиента, даже если форма имеет клиентскую валидацию

```ts
// Правильно
const parsed = loginSchema.safeParse(rawData);
if (!parsed.success) return { success: false, error: "Invalid input" };

// Неправильно
const { username, password } = rawData; // без валидации
```

---

## 3. API-слой (lib/api/)

### Правило: единый fetcher

- Все запросы к DummyJSON проходят через `lib/api/fetcher.ts`
- Fetcher автоматически: подставляет Bearer token из cookies, обрабатывает 401 → refresh → retry, парсит и валидирует ответ через zod-схему

### Правило: типизация API

- Типы ответов DummyJSON — в `lib/api/types/`
- Для каждого ресурса: `product.types.ts`, `cart.types.ts`, `user.types.ts`
- Zod-схемы рядом с типами или в отдельных `.schema.ts` файлах
- Из zod-схем выводить TypeScript типы через `z.infer<>`, а не дублировать вручную

### Правило: не кешировать авторизованные данные

- Запросы к `/auth/*` эндпоинтам — **всегда** `cache: 'no-store'` или `noStore()`
- Данные пользователя, корзина, продукты — per-request, не кешируются между пользователями
- Нарушение: один пользователь увидит данные другого

---

## 4. Производительность

### Правило: параллельные запросы на Dashboard

- SSR-данные Dashboard (user, carts, products) загружаются через `Promise.all`, а не последовательно
- Каждый запрос может упасть независимо — обрабатывать ошибки каждого отдельно

```ts
// Правильно
const [user, carts, products] = await Promise.all([
  getUser(),
  getUserCarts(userId),
  getProducts({ limit: 5 }),
]);

// Неправильно — последовательно, блокирует рендер
const user = await getUser();
const carts = await getUserCarts(user.id);
const products = await getProducts({ limit: 5 });
```

### Правило: минимизация клиентского JS

- Директива `"use client"` — только на компонентах, которым реально нужна интерактивность
- Не ставить `"use client"` на обёртки или layout-компоненты
- Если компонент рендерит данные + имеет одну кнопку — вынести кнопку в отдельный клиентский компонент, оставив родителя серверным

### Правило: useTransition для мутаций

- Клиентские вызовы Server Actions — через `useTransition` или `useActionState`
- Это даёт `isPending` для loading-состояния без ручного `useState`
- Не блокирует основной поток рендера

### Правило: оптимистичный UI — только где оправдано

- Для этого проекта оптимистичный UI **не требуется**
- Добавление в корзину: показываем loading → ждём ответ → показываем результат
- Не усложнять код ради микрооптимизации в прототипе

---

## 5. Обработка ошибок

### Правило: иерархия Error Boundaries

```
app/
├── error.tsx              # Глобальный fallback
├── (auth)/
│   └── login/
│       └── error.tsx      # Ошибки логина
└── (protected)/
    └── dashboard/
        └── error.tsx      # Ошибки Dashboard
```

- Error Boundaries — **последний рубеж**, не основной механизм
- Основной механизм — `ActionResult<T>` из Server Actions + toast на клиенте

### Правило: toast для пользовательских ошибок

- Ошибки мутаций (добавление в корзину, логин) → toast
- Ошибки загрузки данных (SSR) → error.tsx boundary с кнопкой "Повторить"
- Сетевые ошибки → toast с сообщением "Проверьте подключение"

### Правило: не показывать техническую информацию

- Пользователь видит: "Не удалось добавить товар в корзину"
- Пользователь **не** видит: "TypeError: Cannot read property 'id' of undefined"
- Детали ошибки — в `console.error` на сервере, не на клиенте

---

## 6. Безопасность

### Правило: валидация всех внешних данных

- Ответы DummyJSON валидируются через zod-схемы
- `req.cookies`, `searchParams`, `params` — валидировать перед использованием
- Не использовать `as` type assertion для данных из внешних источников

### Правило: proxy.ts для защиты роутов

- В Next.js 16+ `middleware.ts` переименован в `proxy.ts`, экспортируемая функция — `proxy()`
- `proxy.ts` работает на Node.js runtime (не Edge), что даёт доступ к полному Node.js API
- Проверяет наличие токена в cookies на уровне маршрутизации
- Нет токена + защищённый путь → redirect `/login`
- Есть токен + путь `/login` → redirect `/dashboard`
- Proxy **не** валидирует JWT-подпись — только проверяет наличие cookie
- Proxy — это лёгкий маршрутизатор на сетевом уровне, не место для бизнес-логики

```ts
// proxy.ts
export function proxy(request: NextRequest) { ... }
export const config = { matcher: ['/dashboard/:path*', '/login'] }
```

### Правило: CSRF-защита Server Actions

- Next.js App Router автоматически проверяет `Origin` заголовок для Server Actions
- Не отключать эту проверку
- Не создавать собственные CSRF-токены — встроенная защита достаточна

### Правило: HTTP-заголовки безопасности

- Настроить в `next.config.ts` headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 7. TypeScript

### Правило: strict mode

- `tsconfig.json`: `"strict": true` — без исключений
- Не использовать `any` — если тип неизвестен, используй `unknown` и сужай через проверку
- Не использовать `as` для подавления ошибок типов — исправить тип

### Правило: импорт типов

- Использовать `import type { }` для импорта типов — не увеличивает бандл
- ESLint правило `@typescript-eslint/consistent-type-imports` — включить

---

## 8. Общие правила кода

### Правило: нет barrel-файлов с реэкспортом всего

- `index.ts` в директории компонента — только для этого компонента
- Не создавать `components/index.ts`, который реэкспортирует все компоненты — это ломает tree-shaking

### Правило: env-переменные

- `NEXT_PUBLIC_*` — только для клиентского кода (в этом проекте не должно быть таких)
- Серверные переменные: `API_BASE_URL` — без префикса `NEXT_PUBLIC_`
- Валидировать env при старте через zod

### Правило: абсолютные импорты

- Использовать `@/` alias для всех импортов из `src/`
- Не использовать относительные пути вроде `../../../lib/api/fetcher`
- Исключение: импорты внутри директории компонента (`./ ` допустим)
