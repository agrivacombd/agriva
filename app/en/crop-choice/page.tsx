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
  return <InternationalExtraTools kind="crop-choice" locale="en" />;
}
