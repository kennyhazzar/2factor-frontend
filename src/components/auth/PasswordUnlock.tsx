"use client";

import { useState } from "react";
import { useCrypto } from "@/contexts/CryptoContext";
import { useAuth } from "@/contexts/AuthContext";
import { apolloClient } from "@/lib/apollo-client";
import { AUTH_SALT_QUERY, GET_VAULT_QUERY } from "@/lib/graphql/queries";
import { deriveKeys, fromHex } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Shown when user has a valid JWT session but the encryption key
 * was lost (e.g. page refresh). Re-derives keys and verifies
 * the authKey server-side via vault query before unlocking.
 */
export function PasswordUnlock() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setKeys } = useCrypto();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !user?.email) return;

    setIsLoading(true);
    try {
      // 1. Fetch salt for this user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await apolloClient.query<any>({
        query: AUTH_SALT_QUERY,
        variables: { email: user.email },
      });
      const saltHex = data.authSalt.salt as string;

      // 2. Derive keys locally
      const salt = fromHex(saltHex);
      const { authKey, encryptionKey } = await deriveKeys(password, salt);

      // 3. Verify authKey by calling vault query (server checks Argon2)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await apolloClient.query<any>({
        query: GET_VAULT_QUERY,
        variables: { authKey },
      });

      // 4. Only set keys after server verification succeeded
      setKeys(authKey, encryptionKey);
    } catch {
      toast.error("Неверный пароль");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Разблокировка хранилища</CardTitle>
          <CardDescription>
            Введите пароль для расшифровки ваших токенов
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unlock-password">Пароль</Label>
              <Input
                id="unlock-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Расшифровка..." : "Разблокировать"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
