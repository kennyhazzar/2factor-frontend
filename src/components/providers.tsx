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
          <Header />
          <main>{children}</main>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </CryptoProvider>
    </ApolloProvider>
  );
}
