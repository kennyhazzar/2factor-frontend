import type { Metadata } from "next";
import { SharedGenerator } from "@/components/generator/SharedGenerator";

export const metadata: Metadata = {
  title: "TOTP код — 2FA Vault",
  description: "Быстрый просмотр TOTP-кода по ссылке.",
};

export default async function SharedGeneratorPage({
  params,
}: {
  params: Promise<{ secret: string }>;
}) {
  const { secret } = await params;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <SharedGenerator secret={decodeURIComponent(secret)} />
    </div>
  );
}
