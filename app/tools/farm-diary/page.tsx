import type { Metadata } from "next";
import FarmDiary from "@/components/tools/FarmDiary";

export const metadata: Metadata = {
  title: "Farm Diary Bangladesh | কৃষি ডায়েরি ও ফার্ম রেকর্ড | AGRIVA",
  description: "Keep simple farm records for crops, planting, irrigation, fertilizer, pest observations, harvest and expenses with AGRIVA Farm Diary.",
  alternates: { canonical: "/tools/farm-diary" },
  keywords: ["farm diary Bangladesh", "digital farm diary", "farm record keeping", "কৃষি ডায়েরি", "ফার্ম রেকর্ড", "কৃষকের ডায়েরি"],
};

export default function FarmDiaryPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Farm Diary & Crop Records</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Keep your farm activities and crop records in one place. Record planting, irrigation, fertilizer, pest observations, harvest and expenses for better farm planning.</p><FarmDiary /><article className="prose prose-green mt-14 max-w-none"><h2>Why keep a digital farm diary?</h2><p>Regular records can help farmers remember field activities, compare expenses and understand what happened during a crop cycle. AGRIVA can later use these records to power personalized farm insights.</p><h2>What can you record?</h2><p>Record crop and field details, planting dates, irrigation, fertilizer and pesticide observations, harvest information and farm expenses. Avoid storing sensitive personal information unless it is necessary.</p><h2>Future AI farm intelligence</h2><p>With permission, structured farm records can later be summarized by AGRIVA's AI layer to highlight missing records, upcoming activities and cost trends. AI summaries should remain decision-support information rather than guaranteed agronomic advice.</p><h2>Frequently asked questions</h2><h3>Can I use this for multiple crops?</h3><p>Yes. The diary is designed around individual farm entries, so you can create records for different crops and fields.</p><h3>Will my records be saved?</h3><p>The current page provides a browser-based prototype. A Supabase-backed account and sync layer can be connected next so records persist across devices.</p></article></section></main>;
}
