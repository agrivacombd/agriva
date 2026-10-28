import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "Farming Cost and Profit Calculator",
  description: "Estimate farm production costs, crop revenue and potential profit or loss from seed, fertilizer, labour, irrigation, yield and selling price.",
  alternates: { canonical: "/en/farming-cost-profit-calculator", languages: { en: "/en/farming-cost-profit-calculator", "bn-BD": "/farming-cost-profit-calculator", "x-default": "/farming-cost-profit-calculator" } },
  openGraph: { title: "Farming Cost and Profit Calculator | AGRIVA", description: "Estimate farm costs, crop revenue and potential profit from your own inputs.", url: "/en/farming-cost-profit-calculator", type: "website", locale: "en_US" },
  keywords: ["farming cost calculator", "crop profit calculator", "farm revenue calculator", "farm profitability"],
};

export default function EnglishFarmingCostProfitCalculatorPage() {
  return <StandaloneCalculator kind="profit" locale="en" />;
}
