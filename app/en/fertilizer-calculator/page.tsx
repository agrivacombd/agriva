import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "Fertilizer Rate Calculator by Land Area",
  description: "Estimate fertilizer quantity for acres, hectares or decimals using your field area and locally recommended application rate.",
  alternates: { canonical: "/en/fertilizer-calculator", languages: { en: "/en/fertilizer-calculator", "bn-BD": "/fertilizer-calculator", "x-default": "/fertilizer-calculator" } },
  openGraph: { title: "Fertilizer Rate Calculator | AGRIVA", description: "Estimate fertilizer requirements from field area and application rate.", url: "/en/fertilizer-calculator", type: "website", locale: "en_US" },
  keywords: ["fertilizer calculator", "fertilizer rate per acre", "fertilizer quantity by area"],
};

export default function EnglishFertilizerCalculatorPage() {
  return <StandaloneCalculator kind="fertilizer" locale="en" />;
}
