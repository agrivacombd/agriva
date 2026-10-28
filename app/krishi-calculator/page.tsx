import type { Metadata } from "next";
import ToolsDashboard from "@/components/tools/ToolsDashboard";

export const metadata: Metadata = {
  title: "কৃষি ক্যালকুলেটর: সার, বীজ, চাষের খরচ ও ফসল পরিকল্পনা | AGRIVA",
  description:
    "বাংলাদেশের কৃষকদের জন্য এক জায়গায় কৃষি ক্যালকুলেটর—জমি অনুযায়ী সার ও বীজের হিসাব, চাষের খরচ, সম্ভাব্য লাভ-লোকসান এবং ফসল ক্যালেন্ডারের কাজের চেকলিস্ট।",
  alternates: { canonical: "/krishi-calculator" },
  openGraph: {
    title: "কৃষি ক্যালকুলেটর | AGRIVA",
    description:
      "সার, বীজ, চাষের খরচ-লাভ ও ফসলের কাজের পরিকল্পনা—বাংলায় সহজ কৃষি হিসাব।",
    url: "/krishi-calculator",
    type: "website",
  },
};

export default function KrishiCalculatorPage() {
  return <ToolsDashboard />;
}
