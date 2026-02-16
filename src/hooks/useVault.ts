"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCrypto } from "@/contexts/CryptoContext";
import { useAuth } from "@/contexts/AuthContext";
import { apolloClient } from "@/lib/apollo-client";
import { encryptVault, decryptVault } from "@/lib/crypto";
import { GET_VAULT_QUERY } from "@/lib/graphql/queries";
import { UPDATE_VAULT_MUTATION } from "@/lib/graphql/mutations";
import type { VaultData, TOTPToken } from "@/types/vault";

interface UseVaultReturn {
  tokens: TOTPToken[];
  version: number;
  isLoading: boolean;
  error: string | null;
  fetchVault: () => Promise<void>;
  addToken: (
    token: Omit<TOTPToken, "id" | "createdAt" | "order">
  ) => Promise<void>;
  updateToken: (id: string, updates: Partial<TOTPToken>) => Promise<void>;
  removeToken: (id: string) => Promise<void>;
}

export function useVault(): UseVaultReturn {
  const [tokens, setTokens] = useState<TOTPToken[]>([]);
  const [version, setVersion] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { authKey, encryptionKey, isUnlocked } = useCrypto();
  const { isAuthenticated } = useAuth();

  const saveVault = useCallback(
    async (updatedTokens: TOTPToken[], currentVersion: number) => {
      if (!encryptionKey || !authKey) {
        throw new Error("Encryption key not available");
      }

      const vaultData: VaultData = {
        version: 1,
        tokens: updatedTokens,
        updatedAt: new Date().toISOString(),
      };

      const { encryptedData, iv } = await encryptVault(vaultData, encryptionKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await apolloClient.mutate<any>({
        mutation: UPDATE_VAULT_MUTATION,
        variables: {
          input: {
            authKey,
            encryptedData,
            iv,
            expectedVersion: currentVersion,
            tokenCount: updatedTokens.length,
          },
        },
      });

      const newVersion = data.updateVault.version as number;
      setVersion(newVersion);
      setTokens(updatedTokens);
    },
    [authKey, encryptionKey]
  );

  const fetchVault = useCallback(async () => {
    if (!encryptionKey || !authKey) {
      setError("Encryption key not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await apolloClient.query<any>({
        query: GET_VAULT_QUERY,
        variables: { authKey },
        fetchPolicy: "cache-first",
      });

      const vault = data.vault;

      if (!vault || !vault.encryptedData) {
        // Empty vault — initialize with defaults
        setTokens([]);
        setVersion(vault?.version ?? 0);
        return;
      }

      const decrypted = await decryptVault(
        vault.encryptedData,
        vault.iv,
        encryptionKey
      );

      setTokens(decrypted.tokens);
      setVersion(vault.version);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch vault";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [authKey, encryptionKey]);

  const addToken = useCallback(
    async (token: Omit<TOTPToken, "id" | "createdAt" | "order">) => {
      const newToken: TOTPToken = {
        ...token,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        order: tokens.length,
      };

      const updatedTokens = [...tokens, newToken];
      await saveVault(updatedTokens, version);
    },
    [tokens, version, saveVault]
  );

  const updateToken = useCallback(
    async (id: string, updates: Partial<TOTPToken>) => {
      const updatedTokens = tokens.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      await saveVault(updatedTokens, version);
    },
    [tokens, version, saveVault]
  );

  const removeToken = useCallback(
    async (id: string) => {
      const updatedTokens = tokens.filter((t) => t.id !== id);
      await saveVault(updatedTokens, version);
    },
    [tokens, version, saveVault]
  );

  // Stable ref to avoid re-triggering effect when fetchVault identity changes
  const fetchVaultRef = useRef(fetchVault);
  fetchVaultRef.current = fetchVault;

  // Auto-fetch once when unlocked and authenticated
  useEffect(() => {
    if (isUnlocked && isAuthenticated) {
      fetchVaultRef.current();
    }
  }, [isUnlocked, isAuthenticated]);

  return {
    tokens,
    version,
    isLoading,
    error,
    fetchVault,
    addToken,
    updateToken,
    removeToken,
  };
}
