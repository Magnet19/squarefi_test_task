# E-Commerce Dashboard

A Next.js 16 application built as a test task. Features user authentication, a product catalog with pagination, and cart management — all powered by the DummyJSON public API.

## Live Demo

**https://squarefi-test-task.vercel.app/**

## Tech Stack

- **Next.js 16** (App Router, React Server Components)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** + Radix UI — component library
- **React Hook Form** + **Zod** — form handling and schema validation
- **Sonner** — toast notifications
- **next-themes** — dark/light theme support

## Features

- **Authentication** — login via DummyJSON, tokens stored in `httpOnly` cookies
- **Auto token refresh** — middleware silently refreshes the access token when it expires
- **Dashboard** — user profile, cart summary, and paginated product list
- **Add to cart** — Server Actions to add products to the user's cart
- **Pagination** — client-side pagination with server-fetched pages

## API

This project uses the [DummyJSON](https://dummyjson.com) public REST API as a backend.

| Endpoint | Description |
|---|---|
| `POST /auth/login` | User authentication, returns `accessToken` and `refreshToken` |
| `POST /auth/refresh` | Refreshes access token using the refresh token |
| `GET /auth/me` | Returns the currently authenticated user's profile |
| `GET /auth/products?limit=&skip=` | Fetches a paginated list of products |
| `GET /auth/carts/user/:id` | Fetches the cart(s) for a specific user |
| `POST /auth/carts/add` | Adds a product to the user's cart |

**Authentication flow:** tokens are stored in `httpOnly` cookies (`access_token` / `refresh_token`). The middleware automatically refreshes the access token when it expires, without requiring the user to log in again. All API responses are validated with Zod schemas on the server side.

## Getting Started

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> You can use any test account from [DummyJSON users](https://dummyjson.com/users), e.g. username: `emilys`, password: `emilyspass`.
>
> To see a non-empty cart, use an account that has cart data in DummyJSON, e.g. username: `oliviaw`, password: `oliviawpass`.
