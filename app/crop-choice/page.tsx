import type { Metadata } from "next";
import CropChoiceSimulator from "@/components/tools/CropChoiceSimulator";

export const metadata: Metadata = {
  title: "ফসল বাছাই ও চাষের লাভ-লোকসান তুলনা | AGRIVA",
  description: "নিজের জমি, চাষের খরচ, সম্ভাব্য ফলন ও বিক্রয়মূল্য দিয়ে তিনটি ফসলের সম্ভাব্য আয় ও লাভ তুলনা করুন। ফলাফল অনুমানভিত্তিক; স্থানীয় দাম ও কৃষি পরামর্শ যাচাই করুন।",
  alternates: { canonical: "/crop-choice" },
  keywords: ["ফসল বাছাই", "চাষের লাভ লোকসান", "ফসলের লাভ হিসাব", "কৃষি ক্যালকুলেটর", "ফসলের ফলন ও দাম"],
  openGraph: { type: "website", locale: "bn_BD", siteName: "AGRIVA", title: "ফসল বাছাই ও লাভ তুলনা | AGRIVA", description: "খরচ, ফলন ও বাজারদর দিয়ে তিনটি ফসলের সম্ভাব্য লাভ তুলনা করুন।", url: "/crop-choice" },
};

export default function CropChoicePage() {
  return <CropChoiceSimulator />;
}
