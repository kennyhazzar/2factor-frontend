"use client";

import { useState, useCallback } from "react";
import { ClipboardIcon, CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  copied?: boolean;
  onCopy?: () => void;
}

export function CopyButton({ text, className, copied: controlledCopied, onCopy }: CopyButtonProps) {
  const [internalCopied, setInternalCopied] = useState(false);
  const t = useTranslations("common");
  const isControlled = controlledCopied !== undefined;
  const copied = isControlled ? controlledCopied : internalCopied;

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setInternalCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setInternalCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  }, [text, t, onCopy]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn("shrink-0", className)}
      aria-label={t("copyAriaLabel")}
    >
      {copied ? (
        <CheckIcon className="size-4 text-primary" />
      ) : (
        <ClipboardIcon className="size-4" />
      )}
    </Button>
  );
}
