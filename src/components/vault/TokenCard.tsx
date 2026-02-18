"use client";

import { useCallback, useState } from "react";
import { EllipsisVerticalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTotp } from "@/hooks/useTotp";
import { ProgressTimer } from "@/components/ui/ProgressTimer";
import { CopyButton } from "@/components/ui/CopyButton";
import { TokenDetailsDialog } from "@/components/vault/TokenDetailsDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { TOTPToken } from "@/types/vault";

interface TokenCardProps {
  token: TOTPToken;
  onUpdate?: (id: string, updates: Partial<TOTPToken>) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function TokenCard({ token, onUpdate, onDelete }: TokenCardProps) {
  const { code, rawCode, remainingSeconds, period } = useTotp(token);
  const isExpiring = remainingSeconds <= 5;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const t = useTranslations("vault");
  const tc = useTranslations("common");

  const handleCodeClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      toast.success(tc("copied"));
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error(tc("copyFailed"));
    }
  }, [rawCode, tc]);

  return (
    <>
      <Card className="flex flex-col gap-3 px-4 py-3">
        {/* Top row: service info + settings button */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {token.issuer}
            </p>
            {token.account && (
              <p className="truncate text-xs text-muted-foreground">
                {token.account}
              </p>
            )}
          </div>
          {onUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 -mr-2 -mt-1"
              onClick={() => setDetailsOpen(true)}
              aria-label={t("detailsAriaLabel")}
            >
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          )}
        </div>

        {/* Bottom row: two containers */}
        <div className="flex items-center justify-between gap-2">
          {/* Container 1: Code + Copy */}
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={handleCodeClick}
              className={`font-code whitespace-nowrap text-2xl sm:text-3xl tracking-widest cursor-pointer select-none rounded-md px-1 py-1.5 transition-colors hover:bg-accent active:bg-accent ${
                isExpiring ? "animate-pulse text-destructive" : ""
              }`}
              aria-label={t("copyCodeAriaLabel")}
            >
              {code}
            </button>
            <CopyButton text={rawCode} copied={codeCopied} onCopy={handleCodeClick} />
          </div>

          {/* Timer */}
          <ProgressTimer remainingSeconds={remainingSeconds} period={period} />
        </div>
      </Card>

      {/* Details/Edit/Delete dialog */}
      {onUpdate && (
        <TokenDetailsDialog
          token={token}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onSave={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
