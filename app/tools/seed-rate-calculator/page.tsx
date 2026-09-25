import type { Metadata } from "next";
import SeedRateCalculator from "@/components/tools/SeedRateCalculator";

export const metadata: Metadata = {
  title: "Seed Rate Calculator Bangladesh | বীজের পরিমাণ হিসাব | AGRIVA",
  description: "Calculate estimated seed quantity and seed cost from crop, land area and reference seed rate. কৃষকের জন্য সহজ বীজ হিসাব ক্যালকুলেটর।",
  alternates: { canonical: "/tools/seed-rate-calculator" },
  keywords: ["seed rate calculator Bangladesh", "seed quantity calculator", "বীজের পরিমাণ হিসাব", "বীজ ক্যালকুলেটর", "farmer seed calculator"],
};

export default function SeedRateCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Seed Rate Calculator Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Estimate how much seed you may need for a crop based on land area and a reference seed rate. Add seed price to estimate your seed budget.</p><SeedRateCalculator /><article className="prose prose-green mt-14 max-w-none"><h2>How the seed rate calculator works</h2><p>Estimated seed quantity is calculated from land area multiplied by the selected reference seed rate. Seed requirements can vary by crop variety, planting method, germination rate, spacing, season and local recommendations.</p><h2>Why seed rate matters</h2><p>Using an appropriate seed rate can help farmers plan input costs and avoid buying substantially more or less seed than needed. Always use certified or locally recommended seed and follow the variety-specific guidance where available.</p><h2>Important note for farmers</h2><p>This tool is a planning estimate, not a universal agronomic prescription. Confirm the recommended seed rate for your crop variety, production method and local conditions before planting.</p><h2>Frequently asked questions</h2><h3>Does every rice variety use the same seed rate?</h3><p>No. Seed rate can vary with variety, planting method and production system.</p><h3>Can I calculate seed cost?</h3><p>Yes. Enter an estimated seed price per kilogram and AGRIVA will calculate the approximate seed budget.</p></article></section></main>;
}
