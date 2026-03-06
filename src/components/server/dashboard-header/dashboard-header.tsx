import { LogoutButton } from "@/components/client/logout-button/logout-button";
import type { DashboardHeaderProps } from "./dashboard-header.types";

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <LogoutButton />
    </header>
  );
}
