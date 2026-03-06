"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import type { ActionResult } from "@/types/dummyjson";
import { authResponseSchema } from "@/lib/api/types/auth.schema";
import { env } from "@/lib/env";
import { getJwtMaxAge } from "@/lib/auth/jwt";

const loginSchema = z.object({
  username: z.string().min(1, "Имя пользователя обязательно"),
  password: z.string().min(1, "Пароль обязателен"),
});

export async function loginAction(
  _prevState: ActionResult<{ redirect: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ redirect: string }>> {
  // Валидация входных данных через zod (правило §2)
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  try {
    const res = await fetch(`${env.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store", // Правило §3 — auth запросы не кешировать
      body: JSON.stringify({
        ...parsed.data,
        expiresInMins: 30,
      }),
    });

    if (!res.ok) {
      if (res.status === 400) {
        return { success: false, error: "Неверный логин или пароль" };
      }
      return { success: false, error: `Ошибка сервера: ${res.status}` };
    }

    // Валидация ответа через zod-схему (правило §6)
    const json: unknown = await res.json();
    const authParsed = authResponseSchema.safeParse(json);
    if (!authParsed.success) {
      console.error(
        "Login response validation failed:",
        authParsed.error.flatten(),
      );
      return { success: false, error: "Некорректный ответ сервера" };
    }

    const data = authParsed.data;
    const cookieStore = await cookies();

    // Access токен — httpOnly, сессионный (правило §1)
    cookieStore.set("access_token", data.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getJwtMaxAge(data.accessToken) ?? 30 * 60,
    });

    // Refresh токен на долгое время
    cookieStore.set("refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getJwtMaxAge(data.refreshToken) ?? 7 * 24 * 60 * 60,
    });

    return { success: true, data: { redirect: "/dashboard" } };
  } catch (error) {
    // Детали ошибки — на сервер, не на клиент (правило §5)
    console.error("Login Server Action Error:", error);
    return { success: false, error: "Произошла ошибка при входе" };
  }
}

export async function logoutAction(): Promise<
  ActionResult<{ redirect: string }>
> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return { success: true, data: { redirect: "/login" } };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Ошибка при выходе" };
  }
}
