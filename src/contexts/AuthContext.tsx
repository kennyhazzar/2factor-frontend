"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apolloClient } from "@/lib/apollo-client";
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from "@/lib/apollo-client";
import { useCrypto } from "@/contexts/CryptoContext";
import { deriveKeys, fromHex, generateSalt, toHex } from "@/lib/crypto";
import { AUTH_SALT_QUERY, ME_QUERY } from "@/lib/graphql/queries";
import { LOGIN_MUTATION, REGISTER_MUTATION, LOGOUT_MUTATION } from "@/lib/graphql/mutations";
import type { User } from "@/types/vault";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();
  const { setKeys, lock } = useCrypto();

  // Restore session on mount from persisted tokens
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAccessToken();
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await apolloClient.query<any>({ query: ME_QUERY });
        setState({ user: data.me, isAuthenticated: true, isLoading: false });
      } catch {
        clearTokens();
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // 1. Get salt from server
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: saltData } = await apolloClient.query<any>({
        query: AUTH_SALT_QUERY,
        variables: { email },
      });
      const saltHex: string = saltData.authSalt.salt;

      // 2. Derive keys locally (NO state change yet)
      const salt = fromHex(saltHex);
      const { authKey, encryptionKey } = await deriveKeys(password, salt);

      // 3. Login with authKey — server verifies via Argon2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await apolloClient.mutate<any>({
        mutation: LOGIN_MUTATION,
        variables: { input: { email, authKey } },
      });

      const { accessToken, refreshToken, user } = data.login;

      // 4. Only after server confirms — store tokens and set keys
      setTokens(accessToken, refreshToken);
      setKeys(authKey, encryptionKey);

      // 5. Update state
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [setKeys]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      // 1. Generate new salt
      const salt = generateSalt();
      const kdfSalt = toHex(salt);

      // 2. Derive keys locally (NO state change yet)
      const { authKey, encryptionKey } = await deriveKeys(password, salt);

      // 3. Register — server stores hashed authKey
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await apolloClient.mutate<any>({
        mutation: REGISTER_MUTATION,
        variables: { input: { email, authKey, kdfSalt } },
      });

      const { accessToken, refreshToken, user } = data.register;

      // 4. Only after server confirms — store tokens and set keys
      setTokens(accessToken, refreshToken);
      setKeys(authKey, encryptionKey);

      // 5. Update state
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [setKeys]
  );

  const logout = useCallback(async () => {
    try {
      const rt = getRefreshToken();
      if (rt) {
        await apolloClient.mutate({
          mutation: LOGOUT_MUTATION,
          variables: { input: { refreshToken: rt } },
        });
      }
    } catch {
      // Ignore logout errors
    }

    clearTokens();
    lock();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    await apolloClient.clearStore();
    router.push("/login");
  }, [lock, router]);

  const setUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
