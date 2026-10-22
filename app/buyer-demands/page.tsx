import type { Metadata } from "next";
import BuyerDemandBoard from "@/components/marketplace/BuyerDemandBoard";

export const metadata: Metadata = {
  title: "ক্রেতার চাহিদা | AGRIVA",
  description: "ক্রেতারা কী ফসল, কত পরিমাণ, কোথায় ও কবে চান তা দেখুন। আপনার কাছে ফসল থাকলে আগ্রহ জানান এবং সরাসরি যোগাযোগ করুন।",
  alternates: { canonical: "/buyer-demands" },
};

export default function BuyerDemandsPage() {
  return <BuyerDemandBoard />;
}
