import type { Metadata } from "next";
import WeatherPanel from "@/components/weather/WeatherPanel";

export const metadata: Metadata = {
  title: "কৃষি আবহাওয়া ও ৫ দিনের পূর্বাভাস | AGRIVA",
  description: "বাংলাদেশের নির্বাচিত এলাকার বর্তমান আবহাওয়া ও ৫ দিনের পূর্বাভাস দেখে সেচ, জমির কাজ ও ফসলের পরিকল্পনা সাজান। আবহাওয়ার তথ্য স্থানীয় পরিস্থিতির সঙ্গে মিলিয়ে নিন।",
  alternates: { canonical: "/weather" },
  keywords: ["কৃষি আবহাওয়া", "বাংলাদেশ আবহাওয়ার পূর্বাভাস", "চাষাবাদের আবহাওয়া", "কৃষকের আবহাওয়া", "ফসল ও বৃষ্টি"],
  openGraph: { type: "website", locale: "bn_BD", siteName: "AGRIVA", title: "কৃষি আবহাওয়া ও পূর্বাভাস | AGRIVA", description: "চাষাবাদের পরিকল্পনার জন্য নির্বাচিত এলাকার বর্তমান আবহাওয়া ও ৫ দিনের পূর্বাভাস।", url: "/weather" },
  twitter: { card: "summary", title: "কৃষি আবহাওয়া ও পূর্বাভাস | AGRIVA", description: "চাষাবাদের পরিকল্পনার জন্য নির্বাচিত এলাকার বর্তমান আবহাওয়া ও ৫ দিনের পূর্বাভাস।" },
};

export default function WeatherPage() {
  return <WeatherPanel />;
}
