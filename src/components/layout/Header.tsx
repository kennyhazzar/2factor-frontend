"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const t = useTranslations("header");

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-primary">2FA</span> Vault
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 sm:flex">
          <Link href="/generator">
            <Button variant="ghost" size="sm">
              {t("generator")}
            </Button>
          </Link>

          <LanguageSwitcher />

          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  {t("tokens")}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user?.email ?? t("account")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/settings">{t("settings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t("register")}</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile burger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
            <nav className="flex flex-col gap-2 pt-6">
              <Link href="/generator" onClick={close}>
                <Button variant="ghost" className="w-full justify-start">
                  {t("generator")}
                </Button>
              </Link>

              <div className="flex justify-start px-1">
                <LanguageSwitcher />
              </div>

              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={close}>
                    <Button variant="ghost" className="w-full justify-start">
                      {t("tokens")}
                    </Button>
                  </Link>
                  <Link href="/settings" onClick={close}>
                    <Button variant="ghost" className="w-full justify-start">
                      {t("settings")}
                    </Button>
                  </Link>
                  <div className="my-2 border-t border-border" />
                  {user?.email && (
                    <p className="px-4 text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={() => {
                      logout();
                      close();
                    }}
                  >
                    {t("signOut")}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={close}>
                    <Button variant="ghost" className="w-full justify-start">
                      {t("signIn")}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={close}>
                    <Button className="w-full justify-start">
                      {t("register")}
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
