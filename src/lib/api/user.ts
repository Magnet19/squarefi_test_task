import "server-only";
import { apiFetch } from "@/lib/api/fetcher";
import { userSchema } from "@/lib/api/types/auth.schema";
import type { User } from "@/lib/api/types/auth.schema";

export async function getMe(): Promise<User> {
  return apiFetch("/auth/me", userSchema, { next: { revalidate: 30 } });
}
