import type { Metadata } from "next";
import HarvestDateCalculator from "@/components/tools/HarvestDateCalculator";

export const metadata: Metadata = {
  title: "Harvest Date Calculator Bangladesh | ফসল কাটার সময় হিসাব | AGRIVA",
  description: "Estimate crop harvest dates from planting date and crop growth duration. সহজ harvest planning tool for Bangladesh farmers.",
  alternates: { canonical: "/tools/harvest-date-calculator" },
  keywords: ["harvest date calculator Bangladesh", "crop harvest calculator", "ফসল কাটার সময়", "ফসল সংগ্রহের সময়", "harvest planning tool"],
};

export default function HarvestDateCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Harvest Date Calculator Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Estimate an expected harvest date from your planting date and crop growth duration. Use the result for farm planning and combine it with local weather and crop guidance.</p><HarvestDateCalculator /><article className="prose prose-green mt-14 max-w-none"><h2>How the harvest date calculator works</h2><p>The calculator adds the selected growth duration to your planting date. Actual harvest timing can shift because of crop variety, temperature, water availability, soil, disease pressure and field management.</p><h2>Why harvest planning matters</h2><p>Planning ahead can help farmers arrange labour, storage, transport and buyers. AGRIVA can later connect the estimated harvest window with weather alerts, market information and marketplace workflows.</p><h2>Important note</h2><p>This is an estimate, not a guaranteed harvest date. Confirm crop maturity in the field and follow variety-specific and local agricultural guidance.</p><h2>Frequently asked questions</h2><h3>Can weather change the harvest date?</h3><p>Yes. Weather and crop conditions can accelerate or delay maturity and harvest operations.</p><h3>Can AGRIVA send a harvest reminder?</h3><p>The tool is structured for future reminders based on your planting date and estimated harvest window.</p></article></section></main>;
}
