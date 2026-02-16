import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Регистрация — 2FA Vault",
  description: "Создайте аккаунт в 2FA Vault — zero-knowledge аутентификатор с шифрованным облачным хранилищем.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
