import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "Fertilizer Rate Calculator by Land Area",
  description: "Estimate fertilizer quantity for acres, hectares or decimals using your field area and locally recommended application rate.",
  alternates: { canonical: "/en/fertilizer-calculator", languages: { en: "/en/fertilizer-calculator", "bn-BD": "/fertilizer-calculator", "x-default": "/fertilizer-calculator" } },
  openGraph: { title: "Fertilizer Rate Calculator | AGRIVA", description: "Estimate fertilizer requirements from field area and application rate.", url: "/en/fertilizer-calculator", type: "website", locale: "en_US" },
  keywords: ["fertilizer calculator", "fertilizer rate per acre", "fertilizer quantity by area"],
};

export default function EnglishFertilizerCalculatorPage() {
  return (
    <>
      <StandaloneCalculator kind="fertilizer" locale="en" />
      <article className="prose prose-green mx-auto mt-10 max-w-4xl px-4 pb-12 sm:px-6">
        <h2>How to estimate fertilizer quantity</h2>
        <p>Enter the field area and a crop-appropriate application rate from a soil test or trusted local recommendation. Check that the area unit and rate unit match before using the estimate to plan purchases.</p>
        <h3>Why crop and soil information matter</h3>
        <p>Fertilizer needs vary with crop, variety, growth stage, soil fertility and previous applications. A general rate should not be treated as a universal recommendation for every field.</p>
        <h3>Before applying fertilizer</h3>
        <p>Use soil-test results where available, follow locally approved crop guidance and read the product label. This calculator supports planning; it does not replace advice from a qualified agricultural professional.</p>
      </article>
    </>
  );
}
