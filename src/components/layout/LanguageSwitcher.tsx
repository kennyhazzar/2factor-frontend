"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { apolloClient } from "@/lib/apollo-client";
import { UPDATE_LANGUAGE_MUTATION } from "@/lib/graphql/mutations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobeIcon } from "lucide-react";
import { type Locale, locales } from "@/i18n/config";

const languageLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleChange = async (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;

    // If authenticated, persist to server
    if (isAuthenticated) {
      try {
        await apolloClient.mutate({
          mutation: UPDATE_LANGUAGE_MUTATION,
          variables: { input: { language: newLocale } },
        });
      } catch {
        // Ignore — cookie is already set, language will work client-side
      }
    }

    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <GlobeIcon className="size-4" />
          <span className="uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleChange(loc)}
            className={loc === locale ? "bg-accent" : ""}
          >
            {languageLabels[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
