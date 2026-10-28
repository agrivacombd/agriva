import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "বীজের হার ক্যালকুলেটর: জমি অনুযায়ী বীজের হিসাব",
  description: "একর, হেক্টর বা শতক অনুযায়ী জমির পরিমাণ ও বীজের হার দিয়ে প্রয়োজনীয় বীজের পরিমাণ বের করুন।",
  alternates: { canonical: "/seed-rate-calculator", languages: { "bn-BD": "/seed-rate-calculator", en: "/en/seed-rate-calculator", "x-default": "/seed-rate-calculator" } },
  openGraph: { title: "বীজের হিসাব ক্যালকুলেটর | AGRIVA", description: "জমির পরিমাণ ও বীজের হার দিয়ে আনুমানিক প্রয়োজনীয় বীজ হিসাব করুন।", url: "/seed-rate-calculator", type: "website" },
  keywords: ["বীজের হিসাব", "বীজের হার ক্যালকুলেটর", "জমি অনুযায়ী বীজ", "seed rate calculator"],
};

export default function SeedRateCalculatorPage() {
  return <StandaloneCalculator kind="seed" locale="bn" />;
}
