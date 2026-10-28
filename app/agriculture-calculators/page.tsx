import type { Metadata } from "next";
import CalculatorDirectory from "@/components/tools/CalculatorDirectory";

export const metadata: Metadata = {
  title: "কৃষি ক্যালকুলেটর: সার, বীজ, চাষের খরচ ও লাভ-লোকসান | AGRIVA",
  description: "বাংলায় সার হিসাব, বীজের পরিমাণ, চাষের খরচ ও লাভ-লোকসান এবং ফসলের কাজের চেকলিস্ট ব্যবহার করুন। এক জায়গায় ফ্রি কৃষি ক্যালকুলেটর.",
  alternates: { canonical: "/agriculture-calculators", languages: { "bn-BD": "/agriculture-calculators", en: "/en/agriculture-calculators", "x-default": "/agriculture-calculators" } },
  openGraph: { title: "কৃষি ক্যালকুলেটর | AGRIVA", description: "সার, বীজ, চাষের খরচ-লাভ ও ফসলের কাজের পরিকল্পনার ফ্রি টুলস।", url: "/agriculture-calculators", type: "website", locale: "bn_BD" },
  keywords: ["কৃষি ক্যালকুলেটর", "সার হিসাব", "বীজের হিসাব", "চাষের খরচ", "কৃষি লাভ লোকসান", "ফসল ক্যালেন্ডার"],
};

export default function AgricultureCalculatorsPage() {
  return <CalculatorDirectory locale="bn" />;
}
