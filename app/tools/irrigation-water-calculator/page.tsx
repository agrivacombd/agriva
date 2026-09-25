import type { Metadata } from "next";
import IrrigationWaterCalculator from "@/components/tools/IrrigationWaterCalculator";

export const metadata: Metadata = {
  title: "Irrigation Water Calculator Bangladesh | সেচের পানির হিসাব | AGRIVA",
  description: "Estimate irrigation water volume from crop area, crop water requirement and irrigation efficiency. কৃষকের জন্য সহজ সেচের পানি হিসাব tool.",
  alternates: { canonical: "/tools/irrigation-water-calculator" },
  keywords: ["irrigation water calculator Bangladesh", "irrigation calculator", "water requirement calculator", "সেচের পানির হিসাব", "কৃষি সেচ ক্যালকুলেটর"],
};

export default function IrrigationWaterCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Irrigation Water Calculator Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Estimate the water volume needed for an irrigation event using field area, crop water requirement and irrigation efficiency. Use local agronomic and weather guidance before applying water.</p><IrrigationWaterCalculator /><article className="prose prose-green mt-14 max-w-none"><h2>How the irrigation water calculator works</h2><p>The calculator estimates field water demand and adjusts it for the efficiency of the selected irrigation method. Actual irrigation need changes with crop stage, soil type, rainfall, temperature, evapotranspiration and field conditions.</p><h2>Why irrigation efficiency matters</h2><p>Different irrigation methods lose different amounts of water before it reaches the crop root zone. Including an efficiency estimate makes the planning calculation more realistic, but it does not replace field measurement.</p><h2>Weather-aware farming</h2><p>Before irrigating, farmers should consider recent rainfall and the short-term forecast. AGRIVA can connect this tool to a weather data source so the AI assistant can explain how current conditions may affect the planning estimate.</p><h2>Frequently asked questions</h2><h3>Is this the exact amount of water my field needs?</h3><p>No. It is an estimate for planning. Soil moisture, crop stage, rainfall and local recommendations should be considered before irrigation.</p><h3>Can AGRIVA connect weather data?</h3><p>Yes. The tool is structured so a weather API can be added to provide rainfall and forecast context.</p></article></section></main>;
}
