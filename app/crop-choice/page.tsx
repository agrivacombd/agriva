import type { Metadata } from "next";
import CropChoiceSimulator from "@/components/tools/CropChoiceSimulator";

export const metadata: Metadata = {
  title: "ফসল বাছাই ও লাভ তুলনা | AGRIVA",
  description: "নিজের খরচ, সম্ভাব্য ফলন ও বিক্রির দাম দিয়ে একসঙ্গে তিনটি ফসলের সম্ভাব্য লাভ তুলনা করুন।",
  alternates: { canonical: "/crop-choice" },
};

export default function CropChoicePage() {
  return <CropChoiceSimulator />;
}
