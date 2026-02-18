"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useCrypto } from "@/contexts/CryptoContext";
import { useVault } from "@/hooks/useVault";
import { PasswordUnlock } from "@/components/auth/PasswordUnlock";
import { TokenList } from "@/components/vault/TokenList";
import { AddTokenForm } from "@/components/vault/AddTokenForm";
import { Button } from "@/components/ui/button";
import { LogOutIcon, Loader2Icon, DownloadIcon } from "lucide-react";
import { buildOtpAuthUri } from "@/lib/totp";
import { toast } from "sonner";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const { isUnlocked } = useCrypto();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tb = useTranslations("backup");

  const {
    tokens,
    isLoading: vaultLoading,
    error: vaultError,
    addToken,
    updateToken,
    removeToken,
  } = useVault();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleExport = useCallback(() => {
    if (tokens.length === 0) {
      toast.error(t("noTokensForExport"));
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    const lines = [
      `# ${tb("header")}`,
      `# ${tb("date", { date })}`,
      `# ${tb("count", { count: tokens.length })}`,
      "#",
      `# ${tb("format")}`,
      `# ${tb("warning")}`,
      "",
      ...tokens.map((t) => buildOtpAuthUri(t)),
      "",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `2fa-backup-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("backupSaved"));
  }, [tokens, t, tb]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await removeToken(id);
        toast.success(t("tokenDeleted"));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t("tokenDeleteError");
        toast.error(message);
      }
    },
    [removeToken, t]
  );

  // Show nothing while checking auth
  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated — will redirect
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated but vault is locked — show unlock form
  if (!isUnlocked) {
    return <PasswordUnlock />;
  }

  // Authenticated and unlocked — show dashboard
  return (
    <div className="mx-auto flex flex-1 w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {user?.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AddTokenForm onAdd={addToken} />
          <Button variant="ghost" size="icon" onClick={handleExport} aria-label={t("exportAriaLabel")}>
            <DownloadIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} aria-label={t("logoutAriaLabel")}>
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </header>

      {/* Error state */}
      {vaultError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {vaultError}
        </div>
      )}

      {/* Loading state */}
      {vaultLoading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <TokenList
          tokens={tokens}
          onUpdate={updateToken}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
