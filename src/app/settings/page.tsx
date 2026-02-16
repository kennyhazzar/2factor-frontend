"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCrypto } from "@/contexts/CryptoContext";
import { apolloClient } from "@/lib/apollo-client";
import { setTokens } from "@/lib/apollo-client";
import { generateSalt, toHex, deriveKeys, fromHex, encryptVault, decryptVault } from "@/lib/crypto";
import { CHANGE_PASSWORD_MUTATION, DELETE_ACCOUNT_MUTATION } from "@/lib/graphql/mutations";
import { GET_VAULT_QUERY, AUTH_SALT_QUERY } from "@/lib/graphql/queries";
import { PasswordUnlock } from "@/components/auth/PasswordUnlock";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { VaultData } from "@/types/vault";

export default function SettingsPage() {
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();
  const { isUnlocked, encryptionKey, setKeys } = useCrypto();
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  if (authLoading) return null;
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }
  if (!isUnlocked) return <PasswordUnlock />;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Новые пароли не совпадают");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Пароль должен быть не менее 8 символов");
      return;
    }

    setIsChangingPassword(true);
    try {
      // 1. Get old authKey from password
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: saltResp } = await apolloClient.query<any>({
        query: AUTH_SALT_QUERY,
        variables: { email: user!.email },
      });
      const oldSaltHex = saltResp.authSalt.salt;
      const { authKey: oldAuthKey } = await deriveKeys(
        oldPassword,
        fromHex(oldSaltHex)
      );

      // 2. Fetch current vault data (requires authKey)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: saltData } = await apolloClient.query<any>({
        query: GET_VAULT_QUERY,
        variables: { authKey: oldAuthKey },
      });

      // 3. Derive new keys
      const newSalt = generateSalt();
      const newKdfSalt = toHex(newSalt);
      const { authKey: newAuthKey, encryptionKey: newEncKey } =
        await deriveKeys(newPassword, newSalt);

      // 4. Re-encrypt vault if it exists
      let newEncryptedData: string | undefined;
      let newIv: string | undefined;

      if (encryptionKey && saltData?.vault) {
        const vault: VaultData = await decryptVault(
          saltData.vault.encryptedData,
          saltData.vault.iv,
          encryptionKey
        );
        const encrypted = await encryptVault(vault, newEncKey);
        newEncryptedData = encrypted.encryptedData;
        newIv = encrypted.iv;
      }

      // 5. Call changePassword mutation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await apolloClient.mutate<any>({
        mutation: CHANGE_PASSWORD_MUTATION,
        variables: {
          input: {
            oldAuthKey,
            newAuthKey,
            newKdfSalt,
            newEncryptedData,
            newIv,
          },
        },
      });

      // 6. Update tokens and set new keys (server already verified)
      setTokens(data.changePassword.accessToken, data.changePassword.refreshToken);
      setKeys(newAuthKey, newEncKey);

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Пароль успешно изменён");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ошибка смены пароля");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "УДАЛИТЬ") return;
    if (!deletePassword) {
      toast.error("Введите пароль");
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Derive authKey from entered password
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: saltResp } = await apolloClient.query<any>({
        query: AUTH_SALT_QUERY,
        variables: { email: user!.email },
      });
      const saltHex = saltResp.authSalt.salt;
      const { authKey: derivedAuthKey } = await deriveKeys(
        deletePassword,
        fromHex(saltHex)
      );

      await apolloClient.mutate({
        mutation: DELETE_ACCOUNT_MUTATION,
        variables: { authKey: derivedAuthKey },
      });
      await logout();
      toast.success("Аккаунт удалён");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("password_mismatched") || message.includes("password")) {
        toast.error("Неверный пароль");
      } else {
        toast.error(message || "Ошибка удаления аккаунта");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 pt-8">
      <h1 className="text-2xl font-bold">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle>Аккаунт</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Смена пароля</CardTitle>
          <CardDescription>
            Vault будет автоматически перешифрован новым ключом
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Текущий пароль</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Подтвердите новый пароль</Label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Смена пароля..." : "Сменить пароль"}
            </Button>
          </CardContent>
        </form>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Удаление аккаунта</CardTitle>
          <CardDescription>
            Все данные будут безвозвратно удалены. Введите УДАЛИТЬ для
            подтверждения.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Пароль</Label>
            <Input
              type="password"
              placeholder="Введите текущий пароль"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Подтверждение</Label>
            <Input
              placeholder='Введите "УДАЛИТЬ"'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          </div>
          <Button
            variant="destructive"
            disabled={
              deleteConfirm !== "УДАЛИТЬ" ||
              !deletePassword ||
              isDeletingAccount
            }
            onClick={handleDeleteAccount}
          >
            {isDeletingAccount ? "Удаление..." : "Удалить аккаунт навсегда"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
