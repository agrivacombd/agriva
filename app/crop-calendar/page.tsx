import type { Metadata } from "next";
import CropCalendarPanel from "@/components/crop-calendar/CropCalendarPanel";

export const metadata: Metadata = {
  title: "ফসল ক্যালেন্ডার ও চাষের কাজের তালিকা | AGRIVA",
  description: "ফসলভিত্তিক চাষের কাজের চেকলিস্ট তৈরি করুন, গুরুত্বপূর্ণ কাজ চিহ্নিত করুন এবং ব্রাউজারে নিজের ফসল পরিকল্পনা রাখুন। মৌসুম ও স্থানীয় কৃষি পরামর্শ অনুযায়ী তালিকা মানিয়ে নিন।",
  alternates: { canonical: "/crop-calendar" },
  keywords: ["ফসল ক্যালেন্ডার", "চাষের কাজের তালিকা", "কৃষি পরিকল্পনা", "ফসলের মৌসুম", "কৃষি টুলস বাংলা"],
  openGraph: { type: "website", locale: "bn_BD", siteName: "AGRIVA", title: "ফসল ক্যালেন্ডার ও চাষ পরিকল্পনা | AGRIVA", description: "ফসলভিত্তিক কাজের তালিকা তৈরি ও চাষের পরিকল্পনা গুছিয়ে রাখুন।", url: "/crop-calendar" },
  twitter: { card: "summary", title: "ফসল ক্যালেন্ডার ও চাষ পরিকল্পনা | AGRIVA", description: "ফসলভিত্তিক কাজের তালিকা তৈরি ও চাষের পরিকল্পনা গুছিয়ে রাখুন।" },
};

export default function CropCalendarPage() {
  return <CropCalendarPanel />;
}
