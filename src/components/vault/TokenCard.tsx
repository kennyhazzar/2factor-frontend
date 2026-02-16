"use client";

import { useCallback, useState } from "react";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useTotp } from "@/hooks/useTotp";
import { ProgressTimer } from "@/components/ui/ProgressTimer";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { TOTPToken } from "@/types/vault";

interface TokenCardProps {
  token: TOTPToken;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TokenCard({ token, onEdit, onDelete }: TokenCardProps) {
  const { code, rawCode, remainingSeconds, period } = useTotp(token);
  const isExpiring = remainingSeconds <= 5;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleCodeClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      toast.success("Скопировано");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [rawCode]);

  return (
    <>
      <Card className="flex flex-row items-center gap-4 px-4 py-3">
        {/* Left: Issuer and account */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{token.issuer}</span>
          {token.account && (
            <span className="truncate text-xs text-muted-foreground">
              {token.account}
            </span>
          )}
        </div>

        {/* Center/Right: TOTP code */}
        <button
          type="button"
          onClick={handleCodeClick}
          className={`font-code text-2xl tracking-wider cursor-pointer select-all rounded-md px-2 py-1 transition-colors hover:bg-accent ${
            isExpiring ? "animate-pulse text-destructive" : ""
          }`}
          aria-label="Скопировать код"
        >
          {code}
        </button>

        {/* Far right: Timer, copy, actions */}
        <div className="flex items-center gap-1">
          <ProgressTimer remainingSeconds={remainingSeconds} period={period} />
          <CopyButton text={rawCode} />
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(token.id)}
              aria-label="Редактировать"
            >
              <PencilIcon className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              aria-label="Удалить"
            >
              <TrashIcon className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Удалить токен?</DialogTitle>
            <DialogDescription>
              Токен <strong>{token.issuer}</strong>
              {token.account ? ` (${token.account})` : ""} будет удалён
              без возможности восстановления.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                onDelete?.(token.id);
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
