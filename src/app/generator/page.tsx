import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { QuickGenerator } from "@/components/generator/QuickGenerator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("generatorTitle"),
    description: t("generatorDescription"),
  };
}

export default function GeneratorPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <QuickGenerator />
    </div>
  );
}
