import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "Seed Rate Calculator by Field Area",
  description: "Calculate estimated seed requirements for acres, hectares or decimals using the seed rate appropriate for your crop.",
  alternates: { canonical: "/en/seed-rate-calculator", languages: { en: "/en/seed-rate-calculator", "bn-BD": "/seed-rate-calculator", "x-default": "/seed-rate-calculator" } },
  openGraph: { title: "Seed Rate Calculator | AGRIVA", description: "Estimate seed quantities from field area and seed rate.", url: "/en/seed-rate-calculator", type: "website", locale: "en_US" },
  keywords: ["seed rate calculator", "seed quantity calculator", "seed calculator by area"],
};

export default function EnglishSeedRateCalculatorPage() {
  return <StandaloneCalculator kind="seed" locale="en" />;
}
