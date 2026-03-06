import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasToken =
    cookieStore.has("access_token") || cookieStore.has("refresh_token");

  if (hasToken) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
