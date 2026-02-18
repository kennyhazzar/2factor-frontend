import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("registerTitle"),
    description: t("registerDescription"),
  };
}

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
