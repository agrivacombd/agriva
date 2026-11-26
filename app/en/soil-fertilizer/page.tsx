import type { Metadata } from "next";
import InternationalExtraTools from "@/components/tools/InternationalExtraTools";

export const metadata: Metadata = {
  title: "Soil and Fertilizer Planner | AGRIVA",
  description: "Estimate field-level nitrogen, phosphorus and potassium quantities using nutrient rates from your soil test or qualified local recommendation.",
  alternates: { canonical: "/en/soil-fertilizer", languages: { en: "/en/soil-fertilizer", "bn-BD": "/soil-fertilizer", "x-default": "/soil-fertilizer" } },
  openGraph: { title: "Soil and Fertilizer Planner | AGRIVA", description: "Plan field nutrient quantities from your soil test or local recommendation.", url: "/en/soil-fertilizer", type: "website", locale: "en_US" },
  keywords: ["soil fertilizer planner", "NPK calculator", "field nutrient calculator"],
};

export default function EnglishSoilFertilizerPage() {
  return <>
    <InternationalExtraTools kind="soil" locale="en" />
    <section className="mx-auto max-w-5xl px-4 pb-12 text-slate-800">
      <h2 className="text-xl font-bold">Use soil-test recommendations carefully</h2>
      <p className="mt-3 text-sm leading-7">Enter the field area and the nutrient rates from your soil test or a qualified local recommendation. Check whether rates are expressed as nutrients (such as N, P₂O₅ and K₂O) or as fertilizer products, and confirm the units before calculating quantities.</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">The tool estimates amounts from the rates you provide; it does not diagnose soil or independently prescribe fertilizer. Follow local crop guidance and soil-test advice.</p>
      <a href="/soil-fertilizer" className="mt-4 inline-block font-semibold underline">বাংলা সার ও মাটি পরিকল্পক →</a>
    </section>
  </>;
}
