"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutAction } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleLogout() {
    startTransition(async () => {
      const result = await logoutAction();
      if (result.success) {
        router.push(result.data.redirect);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Выход..." : "Выйти"}
    </Button>
  );
}
