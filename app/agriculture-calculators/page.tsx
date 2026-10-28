import type { Metadata } from "next";
import CalculatorDirectory from "@/components/tools/CalculatorDirectory";

export const metadata: Metadata = {
  title: "Agriculture Calculators: Fertilizer, Seed, Farm Cost & Profit",
  description: "Use AGRIVA's agriculture calculators to estimate fertilizer and seed quantities, farming costs, crop profit and seasonal crop tasks. Available in Bangla and English.",
  alternates: { canonical: "/agriculture-calculators", languages: { "bn-BD": "/agriculture-calculators", en: "/en/agriculture-calculators", "x-default": "/agriculture-calculators" } },
  openGraph: { title: "Agriculture Calculators | AGRIVA", description: "Fertilizer, seed rate, farming cost and crop planning tools in one place.", url: "/agriculture-calculators", type: "website" },
  keywords: ["agriculture calculator", "fertilizer calculator", "seed rate calculator", "farming cost calculator", "crop profit calculator"],
};

export default function AgricultureCalculatorsPage() {
  return <CalculatorDirectory locale="bn" />;
}
