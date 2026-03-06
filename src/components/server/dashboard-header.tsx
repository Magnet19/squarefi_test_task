import { LogoutButton } from "@/components/client/logout-button";
import type { User } from "@/lib/api/types/auth.schema";

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {user.firstName} {user.lastName}
        </p>
      </div>
      <LogoutButton />
    </header>
  );
}
