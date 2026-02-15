"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface CryptoState {
  authKey: string | null;
  encryptionKey: CryptoKey | null;
  isUnlocked: boolean;
}

interface CryptoContextValue extends CryptoState {
  setKeys: (authKey: string, encryptionKey: CryptoKey) => void;
  lock: () => void;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CryptoState>({
    authKey: null,
    encryptionKey: null,
    isUnlocked: false,
  });

  const setKeys = useCallback((authKey: string, encryptionKey: CryptoKey) => {
    setState({ authKey, encryptionKey, isUnlocked: true });
  }, []);

  const lock = useCallback(() => {
    setState({ authKey: null, encryptionKey: null, isUnlocked: false });
  }, []);

  return (
    <CryptoContext.Provider
      value={{
        ...state,
        setKeys,
        lock,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto(): CryptoContextValue {
  const ctx = useContext(CryptoContext);
  if (!ctx) {
    throw new Error("useCrypto must be used within CryptoProvider");
  }
  return ctx;
}
