"use client";

import { useState, useMemo } from "react";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { TokenCard } from "./TokenCard";
import { Input } from "@/components/ui/input";
import type { TOTPToken } from "@/types/vault";

interface TokenListProps {
  tokens: TOTPToken[];
  onUpdate?: (id: string, updates: Partial<TOTPToken>) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function TokenList({ tokens, onUpdate, onDelete }: TokenListProps) {
  const [search, setSearch] = useState("");
  const t = useTranslations("vault");

  const filteredTokens = useMemo(() => {
    if (!search.trim()) return tokens;

    const query = search.toLowerCase().trim();
    return tokens.filter(
      (token) =>
        token.issuer.toLowerCase().includes(query) ||
        token.account.toLowerCase().includes(query)
    );
  }, [tokens, search]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      {tokens.length > 0 && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Token cards */}
      {tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            {t("noTokens")}
          </p>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
