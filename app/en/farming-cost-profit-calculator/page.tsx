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
  return <>
    <StandaloneCalculator kind="profit" locale="en" />
    <section className="mx-auto max-w-5xl px-4 pb-12 text-slate-800">
      <h2 className="text-xl font-bold">What to include in a farm budget</h2>
      <p className="mt-3 text-sm leading-7">List variable costs such as seed, fertilizer, labour, irrigation, crop protection, harvesting, packaging and transport. Add any land rent or equipment costs you need to account for. Estimate revenue using expected harvest quantity and a realistic farm-gate selling price.</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">This calculator provides an estimate from your inputs. Prices, yield, losses and market conditions vary by season and location; it is not a promise of profit.</p>
      <a href="/en/crop-choice" className="mt-4 inline-block font-semibold underline">Compare crop choices →</a>
    </section>
  </>;
}
