import type { Metadata } from "next";
import CropCalendar from "@/components/tools/CropCalendar";

export const metadata: Metadata = {
  title: "Crop Calendar Bangladesh | ফসল চাষ ক্যালেন্ডার | AGRIVA",
  description: "Plan crop planting, growing stages and harvest timing with AGRIVA's Bangladesh crop calendar. Farmer-friendly seasonal agriculture planning tool.",
  alternates: { canonical: "/tools/crop-calendar" },
  keywords: ["crop calendar Bangladesh", "crop planting calendar", "ফসল চাষ ক্যালেন্ডার", "কৃষি ক্যালেন্ডার", "farmer crop calendar"],
};

export default function CropCalendarPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Crop Calendar Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Explore a simple crop planning calendar with planting, growth and harvest windows. Use it as a planning reference and adapt timing to your crop variety, location and local agricultural guidance.</p><CropCalendar /><article className="prose prose-green mt-14 max-w-none"><h2>How to use a crop calendar</h2><p>Select a crop to review its planning window and key stages. Actual timing can vary with variety, weather, soil, irrigation and local growing conditions.</p><h2>Why crop calendars help farmers</h2><p>A seasonal calendar can help organize land preparation, seed purchasing, field operations and harvest planning. AGRIVA is designed to connect these planning tools with relevant articles and marketplace products.</p><h2>Important note</h2><p>Calendar dates are planning references, not guaranteed field schedules. Before planting, verify current local recommendations and conditions.</p><h2>Frequently asked questions</h2><h3>Can the calendar give personalized reminders?</h3><p>Yes. AGRIVA can use the selected crop and planting date as the basis for future reminders, subject to available weather and agricultural data.</p><h3>Will every farmer follow the same dates?</h3><p>No. Crop timing varies by variety, region, season and management practice.</p></article></section></main>;
}
