import { LoginForm } from "@/components/client/login-form";

export const metadata = {
  title: "Вход — E-Commerce",
  description: "Страница авторизации в систему",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm />
    </main>
  );
}
