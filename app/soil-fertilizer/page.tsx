import type { Metadata } from "next";
import SoilFertilizerPlanner from "@/components/tools/SoilFertilizerPlanner";

export const metadata: Metadata = {
  title: "মাটি ও সার পরিকল্পনাকারী | AGRIVA",
  description: "মাটি পরীক্ষার রিপোর্ট বা কৃষি কর্মকর্তার সুপারিশ থেকে জমির প্রয়োজনীয় সার হিসাব করুন।",
  alternates: { canonical: "/soil-fertilizer", languages: { "bn-BD": "/soil-fertilizer", en: "/en/soil-fertilizer", "x-default": "/soil-fertilizer" } },
  openGraph: { title: "মাটি ও সার পরিকল্পনাকারী | AGRIVA", description: "মাটি পরীক্ষার রিপোর্ট বা কৃষি কর্মকর্তার সুপারিশ থেকে জমির পুষ্টি উপাদান ও সার পরিকল্পনা করুন।", url: "/soil-fertilizer", type: "website", locale: "bn_BD" },
  keywords: ["মাটি পরীক্ষা", "মাটি ও সার পরিকল্পনা", "সার হিসাব", "soil fertilizer planner"],
};

export default function SoilFertilizerPage() {
  return <SoilFertilizerPlanner />;
}
