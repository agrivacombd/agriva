import type { Metadata } from "next";
import CropProfitCalculator from "@/components/tools/CropProfitCalculator";

export const metadata: Metadata = {
  title: "Crop Profit Calculator Bangladesh | কৃষি লাভ হিসাব | AGRIVA",
  description: "Calculate crop farming cost, expected revenue and estimated profit in Bangladesh. সহজে জমির পরিমাণ, খরচ, ফলন ও বাজারদর দিয়ে কৃষি লাভ হিসাব করুন।",
  alternates: { canonical: "/tools/crop-profit-calculator" },
  keywords: ["crop profit calculator Bangladesh", "farming profit calculator", "কৃষি লাভ হিসাব", "ফসলের লাভ হিসাব", "farmer calculator Bangladesh"],
};

export default function CropProfitCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Crop Profit Calculator Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Estimate your farming cost, expected sales and crop profit using land area, production cost, expected yield and selling price.</p><CropProfitCalculator /><article className="prose prose-green mt-14 max-w-none"><h2>How to calculate crop farming profit</h2><p>Estimated profit is calculated by subtracting total farming cost from expected revenue. Use realistic local input costs, expected yield and a conservative selling price for a more useful estimate.</p><h2>What you need</h2><ul><li>Land area</li><li>Seed, fertilizer, irrigation and labour costs</li><li>Expected crop yield</li><li>Expected selling price</li></ul><h2>Important note for farmers</h2><p>This calculator provides an estimate, not a guaranteed return. Actual crop yield, market price, weather, input prices and post-harvest losses can change the result.</p></article></section></main>;
}
