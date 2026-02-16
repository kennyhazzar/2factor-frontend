"use client";

import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/lib/apollo-client";
import { CryptoProvider } from "@/contexts/CryptoContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";

export function Providers({ children }: { children: React.ReactNode }) {
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
              Возникли трудности?{" "}
              <a
                href="https://t.me/kennyhazzar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Напишите в Telegram
              </a>
            </footer>
          </div>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </CryptoProvider>
    </ApolloProvider>
  );
}
