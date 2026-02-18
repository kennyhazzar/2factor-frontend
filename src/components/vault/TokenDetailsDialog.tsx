"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LinkIcon, KeyIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { buildOtpAuthUri } from "@/lib/totp";
import type { TOTPToken } from "@/types/vault";

interface TokenDetailsDialogProps {
  token: TOTPToken;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<TOTPToken>) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function TokenDetailsDialog({
  token,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: TokenDetailsDialogProps) {
  const [issuer, setIssuer] = useState(token.issuer);
  const [account, setAccount] = useState(token.account);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const t = useTranslations("vault");
  const tc = useTranslations("common");

  const hasChanges = issuer.trim() !== token.issuer || account.trim() !== token.account;

  const handleSave = async () => {
    if (!issuer.trim()) {
      toast.error(t("enterIssuer"));
      return;
    }

    setIsSaving(true);
    try {
      await onSave(token.id, {
        issuer: issuer.trim(),
        account: account.trim(),
      });
      toast.success(t("tokenUpdated"));
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("updateError");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUri = async () => {
    try {
      await navigator.clipboard.writeText(buildOtpAuthUri(token));
      toast.success(t("uriCopied"));
    } catch {
      toast.error(tc("copyFailed"));
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(token.secret);
      toast.success(t("secretCopied"));
    } catch {
      toast.error(tc("copyFailed"));
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (value: boolean) => {
    if (value) {
      setIssuer(token.issuer);
      setAccount(token.account);
    }
    onOpenChange(value);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("detailsTitle")}</DialogTitle>
        </DialogHeader>

        {/* Edit section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-issuer">{t("issuerLabel")}</Label>
            <Input
              id="edit-issuer"
              type="text"
              placeholder={t("issuerPlaceholder")}
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-account">{t("accountLabel")}</Label>
            <Input
              id="edit-account"
              type="text"
              placeholder={t("accountPlaceholder")}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              disabled={isSaving}
            />
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? t("saving") : t("saveChanges")}
            </Button>
          )}
        </div>

        <Separator />

        {/* Export section */}
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleCopyUri} className="w-full justify-start gap-2">
            <LinkIcon className="size-4" />
            {t("copyUri")}
          </Button>
          <Button variant="outline" onClick={handleCopySecret} className="w-full justify-start gap-2">
            <KeyIcon className="size-4" />
            {t("copySecret")}
          </Button>
        </div>

        {/* Delete section */}
        {onDelete && (
          <>
            <Separator />
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              className="w-full justify-start gap-2"
            >
              <TrashIcon className="size-4" />
              {t("deleteAriaLabel")}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Delete confirmation dialog */}
    {onDelete && (
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("deleteTokenTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteTokenDescription", {
                issuer: token.issuer,
                account: token.account ? t("deleteTokenDescriptionAccount", { account: token.account }) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tc("cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDeleteOpen(false);
                onOpenChange(false);
                onDelete(token.id);
              }}
            >
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
