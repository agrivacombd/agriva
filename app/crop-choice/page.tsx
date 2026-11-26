import type { Metadata } from "next";
import Link from "next/link";
import CropChoiceSimulator from "@/components/tools/CropChoiceSimulator";

const pageUrl = "https://agriva.com.bd/crop-choice";
const faqs = [
  ["ফসলের লাভ কি নিশ্চিতভাবে জানা যায়?", "না। এটি আপনার দেওয়া খরচ, ফলন ও বিক্রয়মূল্যের ভিত্তিতে সম্ভাব্য হিসাব। আবহাওয়া, রোগবালাই, বাজারদর ও উৎপাদন পরিবর্তনে প্রকৃত ফল ভিন্ন হতে পারে।"],
  ["তিনটি ফসল তুলনার সময় কোন তথ্য একই রাখা উচিত?", "তুলনা ন্যায্য করতে একই জমির আয়তন, একই সময়সীমা এবং একই ধরনের খরচের খাত ব্যবহার করুন। প্রতিটি ফসলের জন্য আলাদা বাস্তবসম্মত ফলন ও বিক্রয়মূল্য দিন।"],
  ["জমির ভাড়া ও পরিবারের শ্রমের খরচ ধরতে হবে?", "হ্যাঁ। জমির ভাড়া, পরিবারের শ্রমের আনুমানিক মূল্য, পরিবহন, সেচ, সংরক্ষণ ও বাজারজাতকরণের খরচ ধরলে তুলনা বাস্তবসম্মত হয়।"],
];
export const metadata: Metadata = {
  title: "ফসল বাছাই ও লাভ তুলনা ক্যালকুলেটর",
  description: "নিজের জমি, উৎপাদন খরচ, সম্ভাব্য ফলন ও বাজারদর দিয়ে তিনটি ফসলের আনুমানিক আয়-ব্যয় ও লাভ তুলনা করুন। ঝুঁকি ও হিসাবের সীমাবদ্ধতা জানুন।",
  alternates: { canonical: pageUrl, languages: { "bn-BD": pageUrl, en: "/en/crop-choice", "x-default": pageUrl } },
  openGraph: { title: "ফসল বাছাই ও লাভ তুলনা | AGRIVA", description: "নিজের দেওয়া তথ্য দিয়ে একাধিক ফসলের সম্ভাব্য লাভ-লোকসান তুলনা করুন।", url: pageUrl, type: "website", locale: "bn_BD" },
  keywords: ["ফসল বাছাই", "ফসলের লাভ তুলনা", "কৃষি লাভ লোকসান", "কোন ফসল চাষ করব", "crop choice calculator Bangladesh"],
};
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };

export default function CropChoicePage() {
  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <div className="mx-auto max-w-6xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
      <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">AGRIVA · ফসল পরিকল্পনা</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">কোন ফসল চাষে সম্ভাব্য লাভ বেশি?</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">একই জমির জন্য সর্বোচ্চ তিনটি ফসলের সম্ভাব্য খরচ, উৎপাদন ও বিক্রয়মূল্য তুলনা করুন। সিদ্ধান্তের আগে স্থানীয় বাজার, মৌসুম, পানি, শ্রম ও ঝুঁকি বিবেচনা করুন।</p></header>
      <div className="mt-8"><CropChoiceSimulator /></div>
      <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9">
        <h2>ফসল নির্বাচন করার আগে শুধু বিক্রয়মূল্য নয়, পুরো হিসাব দেখুন</h2>
        <p>যে ফসলের বাজারদর বেশি, সেটিই সবসময় বেশি লাভজনক হবে এমন নয়। বীজ, সার, শ্রম, সেচ, জমি প্রস্তুতি, রোগবালাই ব্যবস্থাপনা, পরিবহন ও বিক্রির সময়কার বাজারদর একসঙ্গে বিবেচনা করতে হয়। এই সিমুলেটর আপনার দেওয়া অনুমানের ভিত্তিতে তুলনা সাজায়—এটি বাজারদর বা ফলনের নিশ্চয়তা দেয় না।</p>
        <h3>তুলনার জন্য প্রয়োজনীয় তথ্য</h3><ul><li>প্রতিটি ফসলের জন্য একই জমির আয়তন ও একই মৌসুম নির্ধারণ করুন।</li><li>বীজ, সার, সেচ, শ্রম, জমি প্রস্তুতি, বালাইনাশক ও অন্যান্য খরচ আলাদা করে লিখুন।</li><li>স্থানীয় বাস্তবতার ভিত্তিতে সম্ভাব্য ফলন দিন; ভালো ফলনের আশাবাদী সংখ্যা একমাত্র অনুমান করবেন না।</li><li>বিক্রয়মূল্য হিসেবে সাম্প্রতিক স্থানীয় বাজারদর ও সম্ভাব্য দরপতনের পরিস্থিতিও বিবেচনা করুন।</li></ul>
        <h3>লাভ হিসাবের সহজ সূত্র</h3><p><strong>সম্ভাব্য মোট আয় = সম্ভাব্য উৎপাদন × প্রতি একক বিক্রয়মূল্য</strong></p><p><strong>সম্ভাব্য নিট লাভ = সম্ভাব্য মোট আয় − মোট উৎপাদন ও বাজারজাতকরণ খরচ</strong></p><p>উদাহরণে ১,০০০ কেজি উৎপাদন এবং ৩০ টাকা/কেজি বিক্রয়মূল্য হলে মোট আয় ৩০,০০০ টাকা। মোট খরচ ২০,০০০ টাকা হলে আনুমানিক লাভ ১০,০০০ টাকা। এগুলো কেবল অঙ্ক বোঝানোর উদাহরণ, কোনো ফসলের বাজারদর বা লাভের পূর্বাভাস নয়।</p>
        <h3>ঝুঁকি ও ব্রেক-ইভেন বিবেচনা</h3><p>ফসলের রোগ, অতিবৃষ্টি, খরা, শ্রমিকের মজুরি, পরিবহন ব্যয় এবং বাজারে একসঙ্গে বেশি সরবরাহ লাভ কমাতে পারে। সম্ভব হলে কম, মাঝারি ও বেশি ফলন—এই তিনটি পরিস্থিতিতে হিসাব করুন। ব্রেক-ইভেন বুঝতে মোট খরচকে বিক্রয়যোগ্য উৎপাদন দিয়ে ভাগ করে প্রতি কেজির ন্যূনতম খরচ অনুমান করতে পারেন।</p>
        <h3>মৌসুম ও স্থানীয় উপযোগিতা যাচাই</h3><p>ফসল নির্বাচন করার আগে <a href="/tools/crop-calendar">ফসল ক্যালেন্ডার</a>, <a href="/weather">কৃষি আবহাওয়া</a>, স্থানীয় কৃষি অফিসের পরামর্শ এবং <a href="https://portal.cropzoning.gov.bd/" target="_blank" rel="noreferrer">BARC কৃষি পরামর্শক বাতায়ন</a> থেকে এলাকা ও মৌসুমের উপযোগিতা যাচাই করুন।</p>
        <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
        <h3>আরও হিসাব করুন</h3><ul><li><Link href="/farming-cost-profit-calculator">চাষের খরচ ও লাভ-লোকসান ক্যালকুলেটর</Link></li><li><Link href="/market-prices">কৃষিপণ্যের বাজারদর</Link></li><li><Link href="/tools/crop-calendar">ফসল ক্যালেন্ডার</Link></li></ul>
      </article>
    </div>
  </main>;
}
