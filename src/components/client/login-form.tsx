"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { loginAction } from "@/lib/actions/auth.actions";
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
import type { ActionResult } from "@/types/dummyjson";

const initialState: ActionResult<{ redirect: string }> | null = null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (!state) return;

    if (state.success && state.data.redirect) {
      // При успешном логине — редирект на dashboard
      router.push(state.data.redirect);
    } else if (!state.success) {
      // Ошибки мутаций → toast (правило §5)
      toast.error(state.error);
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
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Введите имя пользователя"
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
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full mt-5 cursor-pointer"
            disabled={isPending}
          >
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
