export interface VaultData {
  version: 1;
  tokens: TOTPToken[];
  updatedAt: string;
}

export interface TOTPToken {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  algorithm: "SHA-1" | "SHA-256" | "SHA-512";
  digits: 6 | 7 | 8;
  period: number;
  icon?: string;
  createdAt: string;
  order: number;
}

export interface User {
  id: string;
  email: string;
  language: string;
  theme: string;
  hasVault: boolean;
  createdAt?: string;
  updatedAt?: string;
}
