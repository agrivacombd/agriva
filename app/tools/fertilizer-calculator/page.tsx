import type { Metadata } from "next";
import FertilizerCalculator from "@/components/tools/FertilizerCalculator";

export const metadata: Metadata = {
  title: "Fertilizer Calculator Bangladesh | সার হিসাব | AGRIVA",
  description: "Calculate fertilizer quantities by crop, land area and fertilizer type. কৃষকের জন্য সহজ fertilizer planning tool from AGRIVA.",
  alternates: { canonical: "/tools/fertilizer-calculator" },
  keywords: ["fertilizer calculator Bangladesh", "fertilizer calculator for farmers", "সার হিসাব", "সার ক্যালকুলেটর", "কৃষি সার হিসাব"],
};

export default function FertilizerCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Fertilizer Calculator Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Estimate fertilizer quantities from a crop-specific reference rate, land area and selected fertilizer type. Use the result as a planning aid and verify local recommendations before application.</p><FertilizerCalculator /><article className="prose prose-green mt-14 max-w-none"><h2>How the fertilizer calculator works</h2><p>The tool converts a reference nutrient or fertilizer rate into an estimated quantity for your selected land area. Reference rates are kept separate from the calculator logic so AGRIVA can update them from trusted agricultural guidance.</p><h2>Why land area matters</h2><p>Fertilizer recommendations depend on crop, soil, growth stage, nutrient target and area. Enter the correct local land unit and avoid applying a generic rate to every crop.</p><h2>Important farmer safety note</h2><p>This calculator is an estimate and is not a substitute for soil testing or advice from a qualified agricultural professional. Follow the label and locally approved recommendations for any fertilizer product.</p><h2>Frequently asked questions</h2><h3>Can I use the same fertilizer rate for every crop?</h3><p>No. Crop nutrient requirements vary, and soil conditions also affect recommendations.</p><h3>Can AGRIVA give an AI recommendation?</h3><p>The tool is designed to support an AI explanation layer, but AI output should be treated as guidance and checked against trusted local agricultural recommendations.</p></article></section></main>;
}
