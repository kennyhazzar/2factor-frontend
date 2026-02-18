"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateTOTP, formatCode, getRemainingSeconds } from "@/lib/totp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LinkIcon } from "lucide-react";

export function QuickGenerator() {
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const t = useTranslations("generator");
  const tc = useTranslations("common");

  const generate = useCallback(async () => {
    if (!secret.trim()) return;
    try {
      const otp = await generateTOTP(secret.trim());
      setCode(otp);
      setIsActive(true);
    } catch {
      toast.error(t("invalidSecret"));
      setIsActive(false);
      setCode("");
    }
  }, [secret, t]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      const rem = getRemainingSeconds(30);
      setRemaining(rem);
      if (rem === 30) {
        // Period flipped, regenerate
        try {
          const otp = await generateTOTP(secret.trim());
          setCode(otp);
        } catch {
          /* ignore */
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secret]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success(tc("copied"));
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/generator/${encodeURIComponent(secret.trim())}`;
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("quickTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totp-secret">{t("secretLabel")}</Label>
          <Input
            id="totp-secret"
            placeholder={t("secretPlaceholder")}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="font-mono"
          />
        </div>
        <Button onClick={generate} className="w-full">
          {t("generate")}
        </Button>

        {isActive && code && (
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border bg-card p-6"
            onClick={handleCopy}
          >
            <span
              className={`font-code text-4xl tracking-widest ${
                remaining <= 5
                  ? "animate-pulse text-destructive"
                  : "text-primary"
              }`}
            >
              {formatCode(code)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("countdown", { remaining })}
            </span>
          </div>
        )}

        {isActive && code && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCopyLink}
          >
            <LinkIcon className="size-4" />
            {t("copyLink")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
