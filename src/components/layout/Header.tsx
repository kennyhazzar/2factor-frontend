"use client";

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

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-primary">2FA</span> Vault
        </Link>

        <nav className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
