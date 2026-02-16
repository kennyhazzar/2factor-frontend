import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Войти — 2FA Vault",
  description: "Войдите в свой аккаунт 2FA Vault для доступа к зашифрованному хранилищу токенов.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
