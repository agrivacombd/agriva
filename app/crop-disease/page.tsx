import type { Metadata } from "next";
import CropDiseasePanel from "@/components/crop-disease/CropDiseasePanel";

export const metadata: Metadata = {
  title: "ছবি দিয়ে ফসলের রোগ শনাক্তকরণ",
  description: "ফসলের ছবি দিয়ে AI-সহায়তাপ্রাপ্ত প্রাথমিক রোগ বিশ্লেষণ, নিরাপদ করণীয় এবং ব্যক্তিগত রোগ নির্ণয়ের ইতিহাস।",
  alternates: { canonical: "/crop-disease" },
};

export default function CropDiseasePage() {
  return <CropDiseasePanel />;
}
