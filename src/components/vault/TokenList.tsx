"use client";

import { useState, useMemo } from "react";
import { SearchIcon } from "lucide-react";
import { TokenCard } from "./TokenCard";
import { Input } from "@/components/ui/input";
import type { TOTPToken } from "@/types/vault";

interface TokenListProps {
  tokens: TOTPToken[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TokenList({ tokens, onEdit, onDelete }: TokenListProps) {
  const [search, setSearch] = useState("");

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
            placeholder="Поиск по имени или аккаунту..."
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
            Нет токенов. Добавьте первый!
          </p>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">Ничего не найдено</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
