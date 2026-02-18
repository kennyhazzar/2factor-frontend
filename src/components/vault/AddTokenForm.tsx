"use client";

import { useState, useCallback } from "react";
import { PlusIcon, CameraIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRScanner } from "@/components/vault/QRScanner";
import { parseOtpAuthUri, base32Decode } from "@/lib/totp";
import { toast } from "sonner";
import type { TOTPToken } from "@/types/vault";

interface AddTokenFormProps {
  onAdd: (
    token: Omit<TOTPToken, "id" | "createdAt" | "order">
  ) => Promise<void>;
}

type InputMode = "manual" | "uri" | "scan";

export function AddTokenForm({ onAdd }: AddTokenFormProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("vault");

  // Manual mode fields
  const [issuer, setIssuer] = useState("");
  const [account, setAccount] = useState("");
  const [secret, setSecret] = useState("");

  // URI mode field
  const [uri, setUri] = useState("");

  const resetForm = () => {
    setIssuer("");
    setAccount("");
    setSecret("");
    setUri("");
    setMode("manual");
  };

  const isValidBase32 = (value: string): boolean => {
    try {
      const cleaned = value.replace(/[\s=-]/g, "").toUpperCase();
      if (cleaned.length === 0) return false;
      base32Decode(cleaned);
      return true;
    } catch {
      return false;
    }
  };

  const handleManualSubmit = async () => {
    if (!issuer.trim()) {
      toast.error(t("enterIssuer"));
      return;
    }

    if (!secret.trim()) {
      toast.error(t("enterSecret"));
      return;
    }

    if (!isValidBase32(secret)) {
      toast.error(t("invalidBase32"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        issuer: issuer.trim(),
        account: account.trim(),
        secret: secret.replace(/[\s=-]/g, "").toUpperCase(),
        algorithm: "SHA-1",
        digits: 6,
        period: 30,
      });
      toast.success(t("tokenAdded"));
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("addTokenError");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUriSubmit = async () => {
    if (!uri.trim()) {
      toast.error(t("enterUri"));
      return;
    }

    let parsed;
    try {
      parsed = parseOtpAuthUri(uri.trim());
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("invalidUri");
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        issuer: parsed.issuer,
        account: parsed.account,
        secret: parsed.secret,
        algorithm: parsed.algorithm,
        digits: parsed.digits,
        period: parsed.period,
      });
      toast.success(t("tokenAdded"));
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("addTokenError");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "manual") {
      handleManualSubmit();
    } else if (mode === "uri") {
      handleUriSubmit();
    }
  };

  const handleQRScan = useCallback(
    async (scannedUri: string) => {
      let parsed;
      try {
        parsed = parseOtpAuthUri(scannedUri);
      } catch {
        toast.error(t("qrInvalidUri"));
        return;
      }

      setIsSubmitting(true);
      try {
        await onAdd({
          issuer: parsed.issuer,
          account: parsed.account,
          secret: parsed.secret,
          algorithm: parsed.algorithm,
          digits: parsed.digits,
          period: parsed.period,
        });
        toast.success(t("tokenAdded"));
        resetForm();
        setOpen(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t("addTokenError");
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onAdd, t]
  );

  const handleQRError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const tabClass = (tab: InputMode) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      mode === tab
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon" className="sm:size-auto sm:px-4 sm:py-2">
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">{t("addTokenButton")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addTokenTitle")}</DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button type="button" onClick={() => setMode("manual")} className={tabClass("manual")}>
            {t("manualTab")}
          </button>
          <button type="button" onClick={() => setMode("uri")} className={tabClass("uri")}>
            {t("uriTab")}
          </button>
          <button type="button" onClick={() => setMode("scan")} className={tabClass("scan")}>
            <CameraIcon className="mr-1.5 inline-block size-4" />
            {t("qrTab")}
          </button>
        </div>

        {mode === "scan" ? (
          <QRScanner onScan={handleQRScan} onError={handleQRError} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "manual" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="issuer">{t("issuerLabel")}</Label>
                  <Input
                    id="issuer"
                    type="text"
                    placeholder={t("issuerPlaceholder")}
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">{t("accountLabel")}</Label>
                  <Input
                    id="account"
                    type="text"
                    placeholder={t("accountPlaceholder")}
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret">{t("secretLabel")}</Label>
                  <Input
                    id="secret"
                    type="text"
                    placeholder={t("secretPlaceholder")}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="font-code tracking-wider"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="uri">{t("uriLabel")}</Label>
                <textarea
                  id="uri"
                  placeholder={t("uriPlaceholder")}
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("addSubmitting") : t("addSubmit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
