import type { Metadata } from "next";
import Link from "next/link";
import FarmDiary from "@/components/tools/FarmDiary";

export const metadata: Metadata = {
  title: "AGRIVA Farm Diary | কৃষি ডায়েরি ও খামারের রেকর্ড",
  description: "ফসল, জমি, বপন, সেচ, সার, রোগ পর্যবেক্ষণ, কাটাই ও খরচের তথ্য গুছিয়ে রাখার ব্যবহারিক নির্দেশনা।",
  alternates: { canonical: "/tools/farm-diary" },
  robots: { index: false, follow: true },
  keywords: ["কৃষি ডায়েরি", "খামারের রেকর্ড", "farm diary Bangladesh", "farm record keeping", "কৃষি খরচের হিসাব"],
};

export default function FarmDiaryPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">AGRIVA · খামার ব্যবস্থাপনা</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">কৃষি ডায়েরি ও খামারের রেকর্ড</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">মৌসুমজুড়ে জমির কাজ, উপকরণ, পর্যবেক্ষণ, উৎপাদন ও ব্যয়ের তথ্য নিয়মিত লিখে রাখুন। সঠিক রেকর্ড পরের মৌসুমের পরিকল্পনা ও খরচ তুলনায় সাহায্য করে।</p></header>
    <div className="mt-8"><FarmDiary /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>কৃষি ডায়েরিতে কী কী লিখবেন?</h2><ul><li><strong>জমি ও ফসল:</strong> জমির পরিচিতি, আয়তন, ফসলের নাম, জাত ও মৌসুম।</li><li><strong>বপন/রোপণ:</strong> তারিখ, বীজ বা চারার উৎস এবং জমি প্রস্তুতির তথ্য।</li><li><strong>পরিচর্যা:</strong> সেচ, সার প্রয়োগ, আগাছা দমন ও অন্যান্য মাঠকাজের তারিখ।</li><li><strong>রোগ-পোকা পর্যবেক্ষণ:</strong> লক্ষণ, আক্রান্ত অংশ, ছবি বা পর্যবেক্ষণের নোট।</li><li><strong>উৎপাদন ও ব্যয়:</strong> কাটাইয়ের পরিমাণ, বিক্রয়, শ্রম, উপকরণ ও পরিবহনের খরচ।</li></ul>
      <h3>রেকর্ড রাখার সহজ নিয়ম</h3><p>কাজ শেষ হওয়ার দিনেই তারিখ ও পরিমাণ লিখুন। প্রতিটি খরচের একক (কেজি, লিটার, ঘণ্টা, টাকা) উল্লেখ করুন। নগদ, বাকির খরচ ও পরিবারের শ্রম আলাদা নোট করুন। একই ফসলের মৌসুমভিত্তিক রেকর্ড রাখলে তুলনা করা সহজ হয়।</p>
      <h3>ব্যক্তিগত তথ্যের নিরাপত্তা</h3><p>রেকর্ডে প্রয়োজনের অতিরিক্ত পরিচয়পত্র, ব্যাংক তথ্য, পাসওয়ার্ড বা সংবেদনশীল তথ্য লিখবেন না। শেয়ার করার আগে নোটে থাকা ব্যক্তিগত তথ্য যাচাই করুন।</p>
      <h3>রেকর্ড থেকে কী শিখবেন?</h3><p>আগের মৌসুমের খরচ, ফলন, সেচ ও সমস্যার নোট দেখে কোন খাতে ব্যয় বেশি হয়েছে এবং কোন সময়ে কাজ করতে হয়েছে তা বুঝতে পারবেন। তবে আগের ফলন পরের মৌসুমের নিশ্চয়তা নয়—আবহাওয়া, বাজার ও মাঠের অবস্থা বদলায়।</p>
      <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/farming-cost-profit-calculator">চাষের খরচ ও লাভ হিসাব</Link></li><li><Link href="/tools/harvest-date-calculator">ফসল কাটার সম্ভাব্য তারিখ</Link></li><li><Link href="/weather">কৃষি আবহাওয়া</Link></li></ul>
    </article>
  </section></main>;
}
