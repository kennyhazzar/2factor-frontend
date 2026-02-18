import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SharedGenerator } from "@/components/generator/SharedGenerator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("sharedGeneratorTitle"),
    description: t("sharedGeneratorDescription"),
  };
}

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
