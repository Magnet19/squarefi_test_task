"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Result } from "@/types/dummyjson";

const initialState: Result<{ redirect: string }> | null = null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const router = useRouter();

  // При успешном логине — редирект на dashboard
  useEffect(() => {
    if (state?.success && state.data.redirect) {
      router.push(state.data.redirect);
    }
  }, [state, router]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Вход в систему
        </CardTitle>
        <CardDescription className="text-center">
          Введите ваши учётные данные для доступа к панели
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {/* Ошибка из Server Action (Result<T, E>) */}
          {state && !state.success && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {state.error.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="emilys"
              required
              autoComplete="username"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Вход..." : "Войти"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Тестовый аккаунт:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              emilys
            </code>{" "}
            /{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              emilyspass
            </code>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
