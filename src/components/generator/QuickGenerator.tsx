"use client";

import { useState, useEffect, useCallback } from "react";
import { generateTOTP, formatCode, getRemainingSeconds } from "@/lib/totp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function QuickGenerator() {
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [isActive, setIsActive] = useState(false);

  const generate = useCallback(async () => {
    if (!secret.trim()) return;
    try {
      const otp = await generateTOTP(secret.trim());
      setCode(otp);
      setIsActive(true);
    } catch {
      toast.error("Неверный секрет (должен быть Base32)");
      setIsActive(false);
      setCode("");
    }
  }, [secret]);

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
      toast.success("Скопировано");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Быстрый TOTP генератор</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totp-secret">Secret (Base32)</Label>
          <Input
            id="totp-secret"
            placeholder="JBSWY3DPEHPK3PXP"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="font-mono"
          />
        </div>
        <Button onClick={generate} className="w-full">
          Генерировать
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
              {remaining}с — нажмите для копирования
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
