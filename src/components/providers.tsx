"use client";

import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/lib/apollo-client";
import { CryptoProvider } from "@/contexts/CryptoContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { useTranslations } from "next-intl";

export function Providers({ children }: { children: React.ReactNode }) {
  const t = useTranslations("footer");
  return (
    <ApolloProvider client={apolloClient}>
      <CryptoProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex flex-1 flex-col">
              {children}
            </main>
            <footer className="shrink-0 py-4 text-center text-sm text-muted-foreground">
              {t("trouble")}{" "}
              <a
                href="https://t.me/kennyhazzar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t("telegram")}
              </a>
            </footer>
          </div>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </CryptoProvider>
    </ApolloProvider>
  );
}
