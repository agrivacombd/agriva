import type { Metadata } from "next";
import Link from "next/link";
import AIFarmAssistant from "@/components/tools/AIFarmAssistant";

export const metadata: Metadata = {
  title: "AGRIVA AI Farm Assistant | কৃষি AI সহকারী",
  description: "কৃষি, ফসল, আবহাওয়া, বাজার ও খামারের রেকর্ড নিয়ে প্রশ্ন করুন। AI উত্তরের সীমাবদ্ধতা ও তথ্য যাচাইয়ের নিয়ম জানুন।",
  alternates: { canonical: "/tools/ai-farm-assistant" },
  robots: { index: false, follow: true },
  keywords: ["কৃষি AI সহকারী", "AI farm assistant Bangladesh", "কৃষকের AI", "agriculture AI assistant"],
};

export default function AIFarmAssistantPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">AGRIVA Intelligence</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">AI Farm Assistant · কৃষি সহকারী</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">বাংলা বা ইংরেজিতে কৃষি-সম্পর্কিত প্রশ্ন লিখুন। ভালো উত্তরের জন্য ফসল, জাত, জমির অবস্থা, মৌসুম, গাছের বয়স ও সমস্যার লক্ষণ স্পষ্ট করে উল্লেখ করুন।</p></header>
    <div className="mt-8"><AIFarmAssistant /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>কীভাবে প্রশ্ন করলে বেশি কার্যকর উত্তর পাবেন?</h2><ul><li>ফসলের নাম, জাত এবং বপন/রোপণের সময় লিখুন।</li><li>জমির ধরন, মাটির অবস্থা ও সেচের তথ্য দিন।</li><li>সমস্যা হলে লক্ষণ কোথায়, কখন শুরু এবং কতটা ছড়িয়েছে জানান।</li><li>আপনি কোন সিদ্ধান্ত নিতে চান—সেচ, সার, রোগ পর্যবেক্ষণ, বাজারজাতকরণ নাকি খরচ—তা নির্দিষ্ট করুন।</li></ul>
      <h3>কোন ধরনের কাজে সহায়ক হতে পারে?</h3><p>কৃষি বিষয়ক সাধারণ ব্যাখ্যা, ফসলের পরিচর্যার ধাপ গুছিয়ে নেওয়া, রেকর্ডের সারাংশ বোঝা, হিসাবের ফল ব্যাখ্যা এবং নির্ভরযোগ্য উৎসে কী যাচাই করতে হবে—এসব কাজে AI সহায়ক হতে পারে।</p>
      <h3>তথ্যের সীমাবদ্ধতা ও নিরাপদ ব্যবহার</h3><p>AI ভুল বা অসম্পূর্ণ উত্তর দিতে পারে। সার প্রয়োগের মাত্রা, বালাইনাশক নির্বাচন, রোগ নির্ণয়, পশুস্বাস্থ্য বা আর্থিক সিদ্ধান্তের ক্ষেত্রে AI-এর উত্তরকে একমাত্র ভিত্তি করবেন না। BARC, DAE, BMD/BAMIS, পণ্যের লেবেল এবং স্থানীয় কৃষি কর্মকর্তার নির্দেশনা মিলিয়ে নিন।</p>
      <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/weather">কৃষি আবহাওয়া</Link></li><li><Link href="/soil-fertilizer">মাটি ও সার পরিকল্পনা</Link></li><li><Link href="/crop-disease">ফসলের রোগ সহায়তা</Link></li><li><Link href="/tools/crop-calendar">ফসল ক্যালেন্ডার</Link></li></ul>
    </article>
  </section></main>;
}
