import type { Metadata } from "next";
import CropChoiceSimulator from "@/components/tools/CropChoiceSimulator";

export const metadata: Metadata = {
  title: "ফসল বাছাই ও লাভ তুলনা",
  description: "নিজের খরচ, সম্ভাব্য ফলন ও বিক্রির দাম দিয়ে একসঙ্গে তিনটি ফসলের সম্ভাব্য লাভ তুলনা করুন।",
  alternates: { canonical: "/crop-choice", languages: { "bn-BD": "/crop-choice", en: "/en/crop-choice", "x-default": "/crop-choice" } },
  openGraph: { title: "ফসল বাছাই ও লাভ তুলনা | AGRIVA", description: "নিজের খরচ, ফলন ও বিক্রির দাম দিয়ে তিনটি ফসলের সম্ভাব্য লাভ তুলনা করুন।", url: "/crop-choice", type: "website", locale: "bn_BD" },
  keywords: ["ফসল বাছাই", "ফসলের লাভ তুলনা", "কৃষি লাভ লোকসান", "crop choice calculator"],
};

export default function CropChoicePage() {
  return <CropChoiceSimulator />;
}
