import type { Metadata } from "next";
import CropDiseasePanel from "@/components/crop-disease/CropDiseasePanel";

export const metadata: Metadata = {
  title: "ছবি দিয়ে ফসলের রোগ শনাক্তকরণ ও প্রাথমিক বিশ্লেষণ",
  description: "ধান, সবজি ও অন্যান্য ফসলের সমস্যার ছবি দিয়ে AI-সহায়তাপ্রাপ্ত প্রাথমিক বিশ্লেষণ দেখুন। রোগের লক্ষণ যাচাই করুন এবং প্রয়োজনে কৃষি বিশেষজ্ঞের পরামর্শ নিন।",
  alternates: { canonical: "/crop-disease" },
  keywords: ["ফসলের রোগ শনাক্ত", "গাছের রোগের ছবি", "ধানের রোগ", "সবজির রোগ", "AI ফসল রোগ বিশ্লেষণ"],
  openGraph: { type: "website", locale: "bn_BD", siteName: "AGRIVA", title: "ছবি দিয়ে ফসলের রোগ শনাক্তকরণ | AGRIVA", description: "ফসলের ছবি দিয়ে প্রাথমিক রোগ বিশ্লেষণ ও নিরাপদ পরবর্তী পদক্ষেপ সম্পর্কে জানুন।", url: "/crop-disease" },
  twitter: { card: "summary_large_image", title: "ছবি দিয়ে ফসলের রোগ শনাক্তকরণ | AGRIVA", description: "ফসলের ছবি দিয়ে প্রাথমিক রোগ বিশ্লেষণ ও নিরাপদ পরবর্তী পদক্ষেপ সম্পর্কে জানুন।" },
};

export default function CropDiseasePage() {
  return <CropDiseasePanel />;
}
