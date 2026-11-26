import type { Metadata } from "next";
import InternationalExtraTools from "@/components/tools/InternationalExtraTools";

export const metadata: Metadata = {
  title: "Crop Choice and Profit Comparison Calculator",
  description: "Compare estimated costs, crop yields, revenue and potential profit for three crops using your own farm data.",
  alternates: { canonical: "/en/crop-choice", languages: { en: "/en/crop-choice", "bn-BD": "/crop-choice", "x-default": "/crop-choice" } },
  openGraph: { title: "Crop Choice and Profit Comparison | AGRIVA", description: "Compare potential farm returns across crops before planting.", url: "/en/crop-choice", type: "website", locale: "en_US" },
  keywords: ["crop choice calculator", "crop profit comparison", "crop profitability calculator"],
};

export default function EnglishCropChoicePage() {
  return <>
    <InternationalExtraTools kind="crop-choice" locale="en" />
    <section className="mx-auto max-w-5xl px-4 pb-12 text-slate-800">
      <h2 className="text-xl font-bold">How to compare crop options</h2>
      <p className="mt-3 text-sm leading-7">Use the same land area and units for each crop. Enter realistic input costs, expected yield and selling price, then compare estimated revenue and profit. Include land preparation, seed, fertilizer, labour, irrigation, crop protection, harvest and transport costs where relevant.</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">Results are planning estimates, not guaranteed returns. Actual yields, prices, weather, pest pressure and market access can change the outcome. Confirm crop suitability and input recommendations with local agricultural guidance.</p>
      <a href="/en/farming-cost-profit-calculator" className="mt-4 inline-block font-semibold underline">Open the farm cost calculator →</a>
    </section>
  </>;
}
