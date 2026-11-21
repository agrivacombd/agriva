import type { Metadata } from "next";
import Link from "next/link";
import CropProfitCalculator from "@/components/tools/CropProfitCalculator";

const pageUrl = "https://agriva.com.bd/tools/crop-profit-calculator";
const faqs = [
  ["ক্যালকুলেটরের লাভ কি নিশ্চিত?", "না। এটি আপনার দেওয়া খরচ, উৎপাদন ও বিক্রয়মূল্যের ভিত্তিতে অনুমান। আবহাওয়া, রোগবালাই, বাজারদর ও বিক্রয়যোগ্য উৎপাদন বদলালে প্রকৃত লাভও বদলাবে।"],
  ["কোন কোন খরচ লাভের হিসাবে ধরব?", "বীজ, সার, বালাইনাশক, শ্রম, জমি প্রস্তুতি, সেচ, জমির ভাড়া, যন্ত্র, পরিবহন, সংরক্ষণ ও বাজারজাতকরণের খরচ ধরুন।"],
  ["বাজারদর কীভাবে নির্ধারণ করব?", "স্থানীয় বাজারের সাম্প্রতিক দর, বিক্রির সম্ভাব্য সময় ও মানভেদে দামের পার্থক্য যাচাই করুন। একটি মাত্র আশাবাদী দর ধরে পরিকল্পনা করবেন না।"],
];
export const metadata: Metadata = {
  title: "ফসলের লাভ-লোকসান ক্যালকুলেটর | AGRIVA",
  description: "জমির আয়তন, উৎপাদন খরচ, সম্ভাব্য ফলন ও বিক্রয়মূল্য দিয়ে ফসলের মোট আয়, নিট লাভ এবং প্রতি কেজির খরচ অনুমান করুন।",
  alternates: { canonical: pageUrl },
  openGraph: { title: "ফসলের লাভ-লোকসান হিসাব | AGRIVA", description: "নিজের দেওয়া খরচ, ফলন ও বাজারদর দিয়ে কৃষি লাভের আনুমানিক হিসাব করুন।", url: pageUrl, type: "website", locale: "bn_BD" },
  keywords: ["ফসলের লাভ হিসাব", "কৃষি লাভ লোকসান", "চাষের আয় ব্যয়", "crop profit calculator Bangladesh"],
};
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };

export default function CropProfitCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-9"><p className="text-sm font-bold text-emerald-200">AGRIVA · কৃষি অর্থনীতি</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">ফসলের সম্ভাব্য লাভ-লোকসান হিসাব করুন</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">উৎপাদন খরচ, বিক্রয়যোগ্য ফলন ও সম্ভাব্য বাজারদর দিয়ে মোট আয় এবং আনুমানিক নিট লাভ বুঝুন। বাস্তব খরচ ও সতর্ক বাজার অনুমান ব্যবহার করুন।</p></header>
    <div className="mt-8"><CropProfitCalculator /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>ফসলের লাভ-লোকসান হিসাবের সূত্র</h2><p><strong>মোট বিক্রয় আয় = বিক্রয়যোগ্য উৎপাদন × প্রতি এককের বিক্রয়মূল্য</strong></p><p><strong>আনুমানিক নিট লাভ = মোট বিক্রয় আয় − মোট উৎপাদন ও বাজারজাতকরণ খরচ</strong></p><p>উদাহরণ: ১,২০০ কেজি বিক্রয়যোগ্য উৎপাদন প্রতি কেজি ২৫ টাকায় বিক্রি হলে মোট আয় ৩০,০০০ টাকা। মোট খরচ ২২,০০০ টাকা হলে আনুমানিক নিট লাভ ৮,০০০ টাকা। এটি কেবল গণনার উদাহরণ, কোনো ফসলের লাভের নিশ্চয়তা নয়।</p>
      <h3>খরচের কোন খাত বাদ দেবেন না?</h3><ul><li>বীজ/চারা, সার, বালাইনাশক ও অন্যান্য উপকরণ।</li><li>জমি তৈরি, রোপণ, আগাছা দমন, পরিচর্যা ও ফসল কাটার শ্রম।</li><li>সেচ, জ্বালানি, বিদ্যুৎ, যন্ত্রপাতি ও জমির ভাড়া।</li><li>বাছাই, প্যাকেজিং, পরিবহন, বাজার ফি ও সংরক্ষণ।</li><li>ক্ষতি, নষ্ট হওয়া বা বিক্রি না হওয়া উৎপাদনের বাস্তবসম্মত হিসাব।</li></ul>
      <h3>ফলন ও বাজারদরের ঝুঁকি ধরুন</h3><p>ফলনের পুরোটা বিক্রি হবে ধরে না নিয়ে বিক্রয়যোগ্য উৎপাদন অনুমান করুন। বাজারে সরবরাহ বেড়ে গেলে দর কমতে পারে; বৃষ্টি বা পরিবহন সমস্যায় বিক্রিও বিলম্বিত হতে পারে। কম, মাঝারি ও ভালো—কমপক্ষে তিনটি পরিস্থিতিতে হিসাব করলে ঝুঁকি বোঝা সহজ হয়।</p>
      <h3>প্রতি কেজির উৎপাদন খরচ</h3><p>মোট উৎপাদন খরচকে বিক্রয়যোগ্য উৎপাদন দিয়ে ভাগ করলে প্রতি কেজির গড় খরচ পাওয়া যায়। এই মান বাজারদরের সঙ্গে তুলনা করে বিক্রি লাভজনক কি না প্রাথমিকভাবে বোঝা যায়; তবে ঋণের সুদ, অবচয় বা পরিবারের শ্রম বাদ পড়লে প্রকৃত খরচ কম দেখাতে পারে।</p>
      <h3>সীমাবদ্ধতা</h3><p>ফলাফল আপনার ইনপুটের মানের ওপর নির্ভরশীল। এটি ভবিষ্যৎ বাজারদর, রোগবালাই, আবহাওয়া বা ফলন পূর্বাভাস দেয় না। সিদ্ধান্তের আগে স্থানীয় বাজার ও কৃষি কর্মকর্তার পরামর্শ যাচাই করুন।</p>
      <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
      <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/tools/farm-cost-calculator">খামারের খরচ ক্যালকুলেটর</Link></li><li><Link href="/crop-choice">ফসল বাছাই ও লাভ তুলনা</Link></li><li><Link href="/market-prices">কৃষিপণ্যের বাজারদর</Link></li></ul>
    </article>
  </section></main>;
}
