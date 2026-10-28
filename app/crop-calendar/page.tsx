import type { Metadata } from "next";
import CropCalendarPanel from "@/components/crop-calendar/CropCalendarPanel";

export const metadata: Metadata = {
  title: "আমার ফসল ক্যালেন্ডার | AGRIVA",
  description: "বাংলাদেশের কৃষকদের জন্য ফসলভিত্তিক কাজের চেকলিস্ট ও ব্রাউজারে সংরক্ষিত চাষ পরিকল্পনা।",
  alternates: { canonical: "/crop-calendar", languages: { "bn-BD": "/crop-calendar", en: "/en/crop-calendar", "x-default": "/crop-calendar" } },
};

export default function CropCalendarPage() {
  return <CropCalendarPanel />;
}
