import type { Metadata } from "next";
import { QuickGenerator } from "@/components/generator/QuickGenerator";

export const metadata: Metadata = {
  title: "TOTP Генератор — 2FA Vault",
  description: "Быстрый генератор одноразовых TOTP-кодов. Введите Base32 секрет и получите код без регистрации.",
};

export default function GeneratorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <QuickGenerator />
    </div>
  );
}
