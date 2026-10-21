import type { Metadata } from "next";
import SellHarvestMarketplace from "@/components/marketplace/SellHarvestMarketplace";

export const metadata: Metadata = {
  title: "ফসল বিক্রি করুন | AGRIVA Sell My Harvest",
  description: "কৃষকরা নিজের ফসলের ছবি, পরিমাণ, দাম ও অবস্থান দিয়ে বিক্রির পোস্ট দিন। ক্রেতারা সরাসরি কৃষকের সঙ্গে যোগাযোগ করুন।",
  alternates: { canonical: "/sell-harvest" },
};

export default function SellHarvestPage() {
  return <SellHarvestMarketplace />;
}
