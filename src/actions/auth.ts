"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { AuthResponse, Result } from "@/types/dummyjson";

const loginSchema = z.object({
  username: z.string().min(1, "Имя пользователя обязательно"),
  password: z.string().min(1, "Пароль обязателен"),
  expiresInMins: z.number().optional().default(30), // Время сессии
});

export async function loginAction(
  prevState: any,
  formData: FormData,
): Promise<Result<{ redirect: string }>> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: new Error(errorMsg) };
  }

  try {
    const res = await fetch("https://dummyjson.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      if (res.status === 400) {
        return {
          success: false,
          error: new Error("Неверный логин или пароль"),
        };
      }
      throw new Error(`Ошибка API: ${res.status}`);
    }

    const data: AuthResponse = await res.json();
    const cookieStore = await cookies();

    // Access токен устанавливаем как сессионный или с малым сроком жизни
    cookieStore.set("access_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60, // 30 минут
    });

    // Refresh токен на долгое время
    cookieStore.set("refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    return { success: true, data: { redirect: "/dashboard" } };
  } catch (error) {
    console.error("Login Server Action Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Неизвестная ошибка сервера"),
    };
  }
}

export async function logoutAction(): Promise<Result<{ redirect: string }>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return { success: true, data: { redirect: "/login" } };
  } catch (error) {
    return { success: false, error: new Error("Ошибка при выходе") };
  }
}
