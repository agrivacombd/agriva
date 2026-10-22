import type { Metadata } from "next";
import SoilFertilizerPlanner from "@/components/tools/SoilFertilizerPlanner";

export const metadata: Metadata = {
  title: "মাটি পরীক্ষা ও সার হিসাব পরিকল্পনাকারী | AGRIVA",
  description: "মাটি পরীক্ষার রিপোর্ট বা কৃষি কর্মকর্তার সুপারিশ অনুযায়ী জমির সার পরিকল্পনা করুন। ফসল, জমির আয়তন ও নির্ধারিত মাত্রা যাচাই করে হিসাব করুন; এটি নিজে থেকে সার সুপারিশ দেয় না।",
  alternates: { canonical: "/soil-fertilizer" },
  keywords: ["মাটি পরীক্ষা", "সার হিসাব", "সার প্রয়োগ পরিকল্পনা", "কৃষি ক্যালকুলেটর", "জমির সার হিসাব"],
  openGraph: { type: "website", locale: "bn_BD", siteName: "AGRIVA", title: "মাটি ও সার পরিকল্পনাকারী | AGRIVA", description: "মাটি পরীক্ষার রিপোর্ট ও যাচাইকৃত সুপারিশের ভিত্তিতে সার হিসাব সাজান।", url: "/soil-fertilizer" },
};

export default function SoilFertilizerPage() {
  return <SoilFertilizerPlanner />;
}
