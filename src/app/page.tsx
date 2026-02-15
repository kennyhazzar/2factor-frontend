import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-primary">2FA</span> Vault
        </h1>
        <p className="max-w-md text-muted-foreground">
          Zero-knowledge TOTP аутентификатор с зашифрованным облачным
          хранилищем. Ваши секреты никогда не покидают устройство.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Регистрация
        </Link>
        <Link
          href="/generator"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Генератор
        </Link>
      </div>
    </div>
  );
}
