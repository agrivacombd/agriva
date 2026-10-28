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
  return <InternationalExtraTools kind="soil" locale="en" />;
}
