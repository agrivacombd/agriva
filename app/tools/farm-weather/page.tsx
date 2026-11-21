import type { Metadata } from "next";
import Link from "next/link";
import FarmWeather from "@/components/tools/FarmWeather";

const pageUrl = "https://agriva.com.bd/tools/farm-weather";
const faqs = [
  ["আবহাওয়ার পূর্বাভাস কি জমির হুবহু অবস্থা জানায়?", "না। পূর্বাভাস একটি নির্দিষ্ট এলাকার মডেলভিত্তিক অনুমান। জমির মাটির আর্দ্রতা, নিচু-উঁচু অবস্থান ও স্থানীয় বৃষ্টির পার্থক্য মাঠে যাচাই করতে হবে।"],
  ["বৃষ্টির সম্ভাবনা থাকলে কি সেচ বন্ধ রাখব?", "শুধু সম্ভাবনা দেখে নয়। বৃষ্টির পরিমাণ, জমির আর্দ্রতা, ফসলের পর্যায় ও পানি নিষ্কাশন দেখে সিদ্ধান্ত নিন।"],
  ["ঝড় বা বজ্রপাতের সতর্কতা কোথায় দেখব?", "বাংলাদেশ আবহাওয়া অধিদপ্তর (BMD), BAMIS এবং স্থানীয় প্রশাসনের সর্বশেষ সরকারি সতর্কতা অনুসরণ করুন।"],
];
export const metadata: Metadata = {
  title: "খামারের আবহাওয়া ও কৃষি পূর্বাভাস | AGRIVA",
  description: "খামারের এলাকার তাপমাত্রা, বৃষ্টি, আর্দ্রতা ও বাতাসের পূর্বাভাস দেখে সেচ, স্প্রে ও ফসল কাটার পরিকল্পনা করুন। সরকারি সতর্কতা যাচাইয়ের নির্দেশনাসহ।",
  alternates: { canonical: pageUrl },
  openGraph: { title: "খামারের আবহাওয়া | AGRIVA", description: "কৃষিকাজের পরিকল্পনায় আবহাওয়া, বৃষ্টি ও বাতাসের পূর্বাভাস ব্যবহার করুন।", url: pageUrl, type: "website", locale: "bn_BD" },
  keywords: ["খামারের আবহাওয়া", "কৃষি আবহাওয়া পূর্বাভাস", "বৃষ্টির পূর্বাভাস", "সেচের আবহাওয়া", "farm weather Bangladesh"],
};
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };

export default function FarmWeatherPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">AGRIVA · মাঠপর্যায়ের পরিকল্পনা</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">খামারের আবহাওয়া ও কৃষি পূর্বাভাস</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">এলাকা নির্বাচন বা স্থানাঙ্ক দিয়ে তাপমাত্রা, বৃষ্টিপাত, আর্দ্রতা ও বাতাসের পূর্বাভাস দেখুন। সেচ, স্প্রে, মাঠের কাজ ও ফসল সংগ্রহের পরিকল্পনায় তথ্যগুলো সহায়ক হিসেবে ব্যবহার করুন।</p></header>
    <div className="mt-8"><FarmWeather /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>কৃষিকাজে কোন আবহাওয়া তথ্য কাজে লাগে?</h2><p>বৃষ্টি ও তার সম্ভাবনা সেচ এবং পানি নিষ্কাশনের পরিকল্পনায়, তাপমাত্রা ফসলের বৃদ্ধি ও মাঠে কাজের সময় নির্ধারণে, আর্দ্রতা রোগ পর্যবেক্ষণে এবং বাতাসের গতি স্প্রে ও অন্যান্য মাঠকাজের নিরাপত্তা বিবেচনায় সাহায্য করে। কোনো একটি মান একা সিদ্ধান্ত নেওয়ার জন্য যথেষ্ট নয়।</p>
      <h3>সেচের আগে</h3><p>সাম্প্রতিক বৃষ্টির পরিমাণ, সামনের বৃষ্টির সম্ভাবনা, জমির মাটির আর্দ্রতা ও ফসলের বৃদ্ধি পর্যায় একসঙ্গে বিবেচনা করুন। অতিবৃষ্টির আশঙ্কায় নালা ও পানি বের হওয়ার পথ সচল রাখুন।</p>
      <h3>স্প্রে বা সার প্রয়োগের আগে</h3><p>বাতাস, বৃষ্টি ও তাপমাত্রা যাচাই করুন। বৃষ্টি বা ঝোড়ো বাতাসে প্রয়োগের কার্যকারিতা ও পার্শ্ববর্তী এলাকায় ছড়িয়ে পড়ার ঝুঁকি থাকতে পারে। পণ্যের লেবেল এবং স্থানীয়ভাবে অনুমোদিত নির্দেশনা অনুসরণ করুন।</p>
      <h3>ফসল কাটার আগে</h3><p>বৃষ্টির পূর্বাভাস, মাঠে প্রবেশযোগ্যতা, শুকানো, মাড়াই ও সংরক্ষণের প্রস্তুতি মিলিয়ে নিন। আবহাওয়ার পূর্বাভাসের কারণে অপরিপক্ব ফসল কাটবেন না; মাঠে পরিপক্বতা যাচাই করুন।</p>
      <h3>ডেটা ও পূর্বাভাসের সীমাবদ্ধতা</h3><p>এই টুলের আবহাওয়া তথ্য Open-Meteo থেকে আসে। মডেলভিত্তিক পূর্বাভাস সময় ও স্থানভেদে পরিবর্তিত হতে পারে এবং গ্রামের প্রতিটি জমির ক্ষুদ্র আবহাওয়া আলাদা হতে পারে। জরুরি সতর্কতা ও সরকারি সিদ্ধান্তের জন্য <a href="https://www.bmd.gov.bd/" target="_blank" rel="noreferrer">BMD</a> এবং <a href="https://www.bamis.gov.bd/" target="_blank" rel="noreferrer">BAMIS</a> যাচাই করুন।</p>
      <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
      <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/weather">জেলা-ভিত্তিক ৫ দিনের আবহাওয়া</Link></li><li><Link href="/tools/irrigation-water-calculator">সেচের পানির হিসাব</Link></li><li><Link href="/tools/harvest-date-calculator">ফসল কাটার সম্ভাব্য তারিখ</Link></li></ul>
    </article>
  </section></main>;
}
