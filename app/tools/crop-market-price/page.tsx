import type { Metadata } from "next";
import Link from "next/link";
import CropMarketPrice from "@/components/tools/CropMarketPrice";

export const metadata: Metadata = {
  title: "ফসলের বাজারদর ও মূল্য পর্যবেক্ষণ | AGRIVA",
  description: "ফসল ও বাজারভিত্তিক মূল্য পর্যবেক্ষণ গুছিয়ে রাখুন। বাজারদর যাচাই, তারিখ ও মানভেদে দামের পার্থক্য এবং বিক্রির আগে করণীয় জানুন।",
  alternates: { canonical: "/tools/crop-market-price" },
  robots: { index: false, follow: true },
  keywords: ["ফসলের বাজারদর", "কৃষিপণ্যের দাম", "বাজার মূল্য পর্যবেক্ষণ", "crop market price Bangladesh"],
};

export default function CropMarketPricePage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">AGRIVA · বাজার তথ্য</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">ফসলের বাজারদর পর্যবেক্ষণ</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">ফসল, বাজার ও তারিখ অনুযায়ী মূল্য পর্যবেক্ষণ গুছিয়ে রাখুন। বিক্রির সিদ্ধান্তের আগে একই মান ও পরিমাণের পণ্যের স্থানীয় ক্রেতার প্রকৃত দর যাচাই করুন।</p></header>
    <div className="mt-8"><CropMarketPrice /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>কৃষকের জন্য বাজারদরের তথ্য কেন গুরুত্বপূর্ণ?</h2><p>ফসল কাটার সময়, সংরক্ষণ, পরিবহন ও বিক্রির পরিকল্পনায় বাজারদর গুরুত্বপূর্ণ। একাধিক বাজারের দর ও সময়ের পরিবর্তন নথিবদ্ধ করলে কোন সময়ে কোথায় বিক্রি করা সুবিধাজনক হতে পারে তা তুলনা করা সহজ হয়। তবে প্রদর্শিত রেফারেন্স দর আর ক্রেতার নিশ্চিত ক্রয়প্রস্তাব এক নয়।</p>
      <h3>দর তুলনার সময় একই মানদণ্ড ব্যবহার করুন</h3><ul><li>একই ফসল ও জাতের দর তুলনা করুন।</li><li>পণ্যের মান, আর্দ্রতা, আকার, গ্রেড ও পরিষ্কার-পরিচ্ছন্নতার পার্থক্য লিখুন।</li><li>দর কোন তারিখে এবং কোন বাজার/আড়ত থেকে নেওয়া হয়েছে তা নথিবদ্ধ করুন।</li><li>একক (কেজি, মণ, বস্তা) এবং পরিবহন বা বাজার খরচ একই ভিত্তিতে আনুন।</li></ul>
      <h3>বিক্রির আগে যাচাই</h3><p>কমপক্ষে একাধিক স্থানীয় ক্রেতা বা বাজারে দর জেনে নিন। কমিশন, ওজনের কাটতি, পরিবহন, প্যাকেজিং, নষ্ট হওয়ার ঝুঁকি ও পেমেন্টের শর্ত হিসাব করুন। কেবল সর্বোচ্চ ঘোষিত দর দেখে বিক্রির সিদ্ধান্ত নেবেন না।</p>
      <h3>দাম ওঠানামার কারণ</h3><p>মৌসুমি সরবরাহ, আবহাওয়া, আমদানি-রপ্তানি, পরিবহন, সংরক্ষণ, পণ্যের মান এবং স্থানীয় চাহিদার কারণে দাম বদলায়। তাই পুরোনো রেকর্ডকে বর্তমান বাজারদর ধরে নেওয়া ঠিক নয়।</p>
      <h3>তথ্যের সীমাবদ্ধতা</h3><p>এই টুলে থাকা তথ্যকে যাচাইযোগ্য পর্যবেক্ষণ হিসেবে বিবেচনা করুন; এটি নিজে থেকে কোনো বাজারে নিশ্চিত বিক্রয়মূল্য বা ক্রেতার অফার নিশ্চিত করে না। বাজারে যাওয়ার আগে সর্বশেষ দর সরাসরি যাচাই করুন।</p>
      <h3>সম্পর্কিত AGRIVA সেবা</h3><ul><li><Link href="/market-prices">বাজারদর পেজ</Link></li><li><Link href="/sell-harvest">ফসল বিক্রির সুযোগ</Link></li><li><Link href="/tools/crop-profit-calculator">ফসলের লাভ-লোকসান ক্যালকুলেটর</Link></li></ul>
    </article>
  </section></main>;
}
