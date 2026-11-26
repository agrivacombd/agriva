import type { Metadata } from "next";
import Link from "next/link";
import HarvestDateCalculator from "@/components/tools/HarvestDateCalculator";

const pageUrl = "https://agriva.com.bd/tools/harvest-date-calculator";
const faqs = [
  ["ক্যালকুলেটরের তারিখ কি নিশ্চিত ফসল কাটার দিন?", "না। এটি রোপণ বা বপনের তারিখের সঙ্গে নির্বাচিত বৃদ্ধিকাল যোগ করে আনুমানিক তারিখ দেখায়। মাঠে পরিপক্বতার লক্ষণ দেখে ফসল কাটার সিদ্ধান্ত নিন।"],
  ["একই ফসলের জাতভেদে কাটার সময় বদলায়?", "হ্যাঁ। জাত, বপন/রোপণের সময়, তাপমাত্রা, পানি, মাটির অবস্থা ও পরিচর্যার কারণে পরিপক্বতার সময় বদলাতে পারে।"],
  ["ফসল কাটার আগে আবহাওয়া দেখা জরুরি কেন?", "বৃষ্টি, ঝড়, অতিরিক্ত আর্দ্রতা ও মাঠের প্রবেশযোগ্যতা কাটাই, শুকানো, মাড়াই ও সংরক্ষণে প্রভাব ফেলতে পারে।"],
];
export const metadata: Metadata = {
  title: "ফসল কাটার সম্ভাব্য তারিখ ক্যালকুলেটর",
  description: "বপন বা রোপণের তারিখ ও ফসলের বৃদ্ধিকাল দিয়ে সম্ভাব্য কাটার সময় হিসাব করুন। মাঠে পরিপক্বতা যাচাই, শ্রমিক ও সংরক্ষণ পরিকল্পনার নির্দেশনা জানুন।",
  alternates: { canonical: pageUrl },
  openGraph: { title: "ফসল কাটার সময় ক্যালকুলেটর | AGRIVA", description: "বপনের তারিখ থেকে সম্ভাব্য ফসল সংগ্রহের সময় পরিকল্পনা করুন।", url: pageUrl, type: "website", locale: "bn_BD" },
  keywords: ["ফসল কাটার সময়", "ফসল সংগ্রহের তারিখ", "বপনের তারিখ হিসাব", "harvest date calculator Bangladesh"],
};
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };

export default function HarvestDateCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-9"><p className="text-sm font-bold text-emerald-200">AGRIVA · ফসল সংগ্রহ পরিকল্পনা</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">ফসল কাটার সম্ভাব্য তারিখ হিসাব করুন</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">বপন বা রোপণের তারিখ এবং ফসলের বৃদ্ধিকাল দিয়ে আনুমানিক সংগ্রহের সময় বের করুন। এরপর মাঠের পরিপক্বতা, আবহাওয়া ও বাজারজাতকরণের প্রস্তুতি মিলিয়ে নিন।</p></header>
    <div className="mt-8"><HarvestDateCalculator /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>ফসল কাটার তারিখ কীভাবে অনুমান করা হয়?</h2><p>সাধারণ হিসাব হলো বপন/রোপণের তারিখের সঙ্গে সংশ্লিষ্ট ফসল ও জাতের আনুমানিক বৃদ্ধিকাল যোগ করা। তবে বীজের জাত, চারা বয়স, মৌসুম, তাপমাত্রা, পানি, পুষ্টি ও রোগবালাইয়ের কারণে প্রকৃত সময় এগিয়ে বা পিছিয়ে যেতে পারে।</p>
      <h3>কাটার পরিকল্পনায় যে বিষয়গুলো ধরবেন</h3><ul><li>বীজের প্যাকেট বা নির্ভরযোগ্য উৎপাদন নির্দেশিকায় উল্লেখিত জাতের বৃদ্ধিকাল।</li><li>চারা রোপণ করলে বীজ বপনের দিন নয়, প্রযোজ্য ক্ষেত্রে জমিতে রোপণের দিন থেকে হিসাব।</li><li>শস্য/ফলের পরিপক্বতার দৃশ্যমান লক্ষণ ও আর্দ্রতার অবস্থা।</li><li>শ্রমিক, কাটাই যন্ত্র, বস্তা, শুকানো, মাড়াই, পরিবহন ও সংরক্ষণের প্রস্তুতি।</li></ul>
      <h3>আবহাওয়া ও সংগ্রহ-পরবর্তী প্রস্তুতি</h3><p>কাটার সম্ভাব্য সময়ের আগে <Link href="/weather">কৃষি আবহাওয়ার পূর্বাভাস</Link> দেখুন। বৃষ্টির সম্ভাবনা থাকলে শুকানো ও সংরক্ষণের জায়গা প্রস্তুত রাখুন। তবে শুধু পূর্বাভাস দেখে অপরিপক্ব ফসল কাটবেন না; ফসলের পরিপক্বতা ও স্থানীয় কৃষি পরামর্শ অগ্রাধিকার দিন।</p>
      <h3>এই টুলের সীমাবদ্ধতা</h3><p>ক্যালকুলেটরটি তারিখভিত্তিক আনুমানিক হিসাব করে; এটি ফসলের জাত শনাক্ত করে না, মাঠের অবস্থা দেখে না এবং পরিপক্বতা নিশ্চিত করে না। নির্ভরযোগ্য জাতভিত্তিক বৃদ্ধিকাল ব্যবহার করুন এবং মাঠে লক্ষণ যাচাই করুন।</p>
      <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
      <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/tools/crop-calendar">ফসল ক্যালেন্ডার</Link></li><li><Link href="/weather">কৃষি আবহাওয়া</Link></li><li><Link href="/farming-cost-profit-calculator">চাষের খরচ ও লাভ হিসাব</Link></li></ul>
    </article>
  </section></main>;
}
