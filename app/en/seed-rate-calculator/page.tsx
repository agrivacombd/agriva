import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "Seed Rate Calculator by Field Area",
  description: "Calculate estimated seed requirements for acres, hectares or decimals using the seed rate appropriate for your crop.",
  alternates: { canonical: "/en/seed-rate-calculator", languages: { en: "/en/seed-rate-calculator", "bn-BD": "/seed-rate-calculator", "x-default": "/seed-rate-calculator" } },
  openGraph: { title: "Seed Rate Calculator | AGRIVA", description: "Estimate seed quantities from field area and seed rate.", url: "/en/seed-rate-calculator", type: "website", locale: "en_US" },
  keywords: ["seed rate calculator", "seed quantity calculator", "seed calculator by area"],
};

export default function EnglishSeedRateCalculatorPage() {
  return (
    <>
      <StandaloneCalculator kind="seed" locale="en" />
      <article className="prose prose-green mx-auto mt-10 max-w-4xl px-4 pb-12 sm:px-6">
        <h2>How to estimate seed requirements</h2>
        <p>Choose the crop, enter the field area and use a seed rate recommended for the variety and planting method. Confirm that the land-area unit and seed-rate unit are compatible before interpreting the result.</p>
        <h3>Factors that change seed rate</h3>
        <p>Variety, direct seeding or transplanting, row spacing, germination percentage, seed quality and season can all affect the quantity needed. Do not apply one crop's seed rate to another crop.</p>
        <h3>Plan seed purchases carefully</h3>
        <p>Use certified or trusted seed and check the package label for variety, lot and validity details. Treat the calculated amount as an estimate and confirm the final rate with local agricultural guidance.</p>
      </article>
    </>
  );
}
