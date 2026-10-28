import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "সার হিসাব ক্যালকুলেটর: জমি অনুযায়ী সারের পরিমাণ",
  description: "একর, হেক্টর বা শতক অনুযায়ী জমির আয়তন ও নির্ধারিত সারের হার দিয়ে প্রয়োজনীয় সার হিসাব করুন।",
  alternates: { canonical: "/fertilizer-calculator", languages: { "bn-BD": "/fertilizer-calculator", en: "/en/fertilizer-calculator", "x-default": "/fertilizer-calculator" } },
  openGraph: { title: "সার হিসাব ক্যালকুলেটর | AGRIVA", description: "জমির আয়তন ও সারের হার দিয়ে মোট প্রয়োজনীয় পরিমাণ হিসাব করুন।", url: "/fertilizer-calculator", type: "website" },
  keywords: ["সার হিসাব", "সার হিসাব ক্যালকুলেটর", "জমি অনুযায়ী সারের পরিমাণ", "fertilizer calculator"],
};

export default function FertilizerCalculatorPage() {
  return <StandaloneCalculator kind="fertilizer" locale="bn" />;
}
