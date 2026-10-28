import type { Metadata } from "next";
import CalculatorDirectory from "@/components/tools/CalculatorDirectory";

export const metadata: Metadata = {
  title: "Agriculture Calculators: Fertilizer, Seed, Farm Cost & Profit",
  description: "Estimate fertilizer and seed quantities, farming costs, crop revenue and seasonal tasks with AGRIVA's free agriculture calculators.",
  alternates: { canonical: "/en/agriculture-calculators", languages: { en: "/en/agriculture-calculators", "bn-BD": "/agriculture-calculators", "x-default": "/agriculture-calculators" } },
  openGraph: { title: "Agriculture Calculators | AGRIVA", description: "Free fertilizer, seed rate, farming cost and crop planning tools.", url: "/en/agriculture-calculators", type: "website", locale: "en_US" },
  keywords: ["agriculture calculators", "fertilizer calculator", "seed rate calculator", "farming cost and profit calculator", "crop calendar"],
};

export default function EnglishAgricultureCalculatorsPage() {
  return <CalculatorDirectory locale="en" />;
}
