"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslations("home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-primary">2FA</span> Vault
        </h1>
        <p className="max-w-md text-muted-foreground">
          {t("tagline")}
        </p>
      </div>
      <div className="flex gap-4">
        {!isLoading && isAuthenticated ? (
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("myTokens")}
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t("register")}
            </Link>
          </>
        )}
        <Link
          href="/generator"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t("generator")}
        </Link>
      </div>
    </div>
  );
}
