import type { Metadata } from "next";
import FarmCostCalculator from "@/components/tools/FarmCostCalculator";

export const metadata: Metadata = {
  title: "Farm Cost Calculator Bangladesh | কৃষি খরচ হিসাব | AGRIVA",
  description: "Calculate total farming cost, cost per acre and cost per kg with AGRIVA Farm Cost Calculator. Track seed, fertilizer, labour, irrigation and other farm expenses.",
  alternates: { canonical: "/tools/farm-cost-calculator" },
  keywords: ["farm cost calculator Bangladesh", "farming cost calculator", "agriculture cost calculator", "কৃষি খরচ হিসাব", "চাষের খরচ ক্যালকুলেটর"],
};

export default function FarmCostCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Farm Cost Calculator Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Track the main costs of crop production and estimate total farm cost, cost per acre and cost per kilogram of expected production.</p><FarmCostCalculator /><article className="prose prose-green mt-14 max-w-none"><h2>How to calculate farming cost</h2><p>Add your actual seed, fertilizer, pesticide, labour, irrigation, land preparation, transport and other expenses. The calculator adds them to estimate your total crop production cost.</p><h2>Why track farm expenses?</h2><p>Recording expenses helps farmers understand where money is being spent and provides a better basis for comparing expected revenue with production cost. AGRIVA can connect this data with the Crop Profit Calculator.</p><h2>Important note</h2><p>Use your actual invoices, wages and input costs where possible. The calculator does not predict market prices or guarantee profit.</p><h2>Frequently asked questions</h2><h3>Can I calculate cost per kilogram?</h3><p>Yes. Enter your expected production and the tool divides estimated total cost by expected production.</p><h3>Can this connect with Crop Profit Calculator?</h3><p>Yes. The architecture is designed so the same farm cost data can later be passed into AGRIVA's profit and AI farm analysis tools.</p></article></section></main>;
}
