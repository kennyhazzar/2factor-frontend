"use client";

import { useState, useCallback } from "react";
import { ClipboardIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Скопировано");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn("shrink-0", className)}
      aria-label="Скопировать"
    >
      {copied ? (
        <CheckIcon className="size-4 text-primary" />
      ) : (
        <ClipboardIcon className="size-4" />
      )}
    </Button>
  );
}
