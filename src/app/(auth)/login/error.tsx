"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Login page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-bold">Ошибка авторизации</h1>
        <p className="text-muted-foreground max-w-sm">
          Не удалось загрузить страницу входа. Проверьте подключение и
          попробуйте снова.
        </p>
        <Button onClick={reset}>Повторить</Button>
      </div>
    </main>
  );
}
