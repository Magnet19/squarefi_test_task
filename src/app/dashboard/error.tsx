"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-bold">Ошибка загрузки Dashboard</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Не удалось загрузить данные. Попробуйте обновить страницу.
      </p>
      <Button onClick={reset}>Повторить</Button>
    </main>
  );
}
