import type { Metadata } from "next";
import WeatherPanel from "@/components/weather/WeatherPanel";

export const metadata: Metadata = {
  title: "কৃষি আবহাওয়া | AGRIVA",
  description: "বাংলাদেশের নির্বাচিত এলাকার বর্তমান আবহাওয়া ও ৫ দিনের পূর্বাভাস দেখুন।",
  alternates: { canonical: "/weather" },
};

export default function WeatherPage() {
  return <WeatherPanel />;
}
