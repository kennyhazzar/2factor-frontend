"use client";

import { useState } from "react";
import Link from "next/link";
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

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);

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
              Генератор
            </Button>
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Токены
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user?.email ?? "Аккаунт"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Настройки</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Регистрация</Button>
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
            <SheetTitle className="sr-only">Меню</SheetTitle>
            <nav className="flex flex-col gap-2 pt-6">
              <Link href="/generator" onClick={close}>
                <Button variant="ghost" className="w-full justify-start">
                  Генератор
                </Button>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={close}>
                    <Button variant="ghost" className="w-full justify-start">
                      Токены
                    </Button>
                  </Link>
                  <Link href="/settings" onClick={close}>
                    <Button variant="ghost" className="w-full justify-start">
                      Настройки
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
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={close}>
                    <Button variant="ghost" className="w-full justify-start">
                      Войти
                    </Button>
                  </Link>
                  <Link href="/register" onClick={close}>
                    <Button className="w-full justify-start">
                      Регистрация
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
