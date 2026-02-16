"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { generateTOTP, formatCode, getRemainingSeconds } from "@/lib/totp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CopyIcon, ArrowLeftIcon } from "lucide-react";

interface SharedGeneratorProps {
  secret: string;
}

export function SharedGenerator({ secret }: SharedGeneratorProps) {
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [error, setError] = useState(false);

  const generate = useCallback(async () => {
    try {
      const otp = await generateTOTP(secret);
      setCode(otp);
      setError(false);
    } catch {
      setError(true);
      setCode("");
    }
  }, [secret]);

  useEffect(() => {
    generate();
  }, [generate]);

  useEffect(() => {
    if (error || !code) return;

    const interval = setInterval(async () => {
      const rem = getRemainingSeconds(30);
      setRemaining(rem);
      if (rem === 30) {
        try {
          const otp = await generateTOTP(secret);
          setCode(otp);
        } catch {
          /* ignore */
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [error, code, secret]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success("Скопировано");
    }
  };

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ошибка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Невалидный секрет. Убедитесь, что ссылка содержит корректный Base32
            ключ.
          </p>
          <Link href="/generator">
            <Button variant="outline" className="w-full">
              <ArrowLeftIcon className="size-4" />
              Открыть генератор
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>TOTP код</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {code && (
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

        <Button variant="outline" className="w-full" onClick={handleCopy}>
          <CopyIcon className="size-4" />
          Скопировать код
        </Button>

        <Link href="/generator">
          <Button variant="ghost" className="w-full">
            <ArrowLeftIcon className="size-4" />
            Открыть генератор
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
