import type { Metadata } from "next";
import Link from "next/link";
import CropDiseaseAssistant from "@/components/tools/CropDiseaseAssistant";

export const metadata: Metadata = {
  title: "ফসলের রোগ ও পোকা বিষয়ে AI সহকারী | AGRIVA",
  description: "ফসলের লক্ষণ লিখে সম্ভাব্য রোগ বা পোকার কারণ, পর্যবেক্ষণের প্রশ্ন ও নিরাপদ পরবর্তী পদক্ষেপ সম্পর্কে প্রাথমিক সহায়তা নিন।",
  alternates: { canonical: "/tools/crop-disease-assistant" },
  robots: { index: false, follow: true },
  keywords: ["ফসলের রোগ", "ফসলের পোকা", "কৃষি AI সহকারী", "crop disease assistant Bangladesh", "crop pest identification"],
};

export default function CropDiseaseAssistantPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">AGRIVA · প্রাথমিক রোগ পর্যবেক্ষণ</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">ফসলের রোগ ও পোকা বিষয়ে AI সহকারী</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">ফসলের নাম, বয়স ও দৃশ্যমান লক্ষণ লিখে সম্ভাব্য কারণ এবং পরবর্তী পর্যবেক্ষণের বিষয়গুলো গুছিয়ে নিন। AI-এর উত্তরকে চূড়ান্ত রোগ নির্ণয় বা কীটনাশক ব্যবহারের নির্দেশনা হিসেবে ধরবেন না।</p></header>
    <div className="mt-8"><CropDiseaseAssistant /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>রোগ বা পোকার সমস্যা বুঝতে কী তথ্য দেবেন?</h2><ul><li>ফসলের নাম, জাত জানা থাকলে জাত এবং গাছের বয়স/বৃদ্ধি পর্যায়।</li><li>কোন অংশ আক্রান্ত—পাতা, কাণ্ড, শিকড়, ফুল, ফল নাকি পুরো গাছ।</li><li>লক্ষণ কখন শুরু হয়েছে এবং কত দ্রুত ছড়াচ্ছে।</li><li>পাতার দাগ, পচন, মোড়ানো, গর্ত, পোকা বা জালের মতো দৃশ্যমান চিহ্ন।</li><li>সাম্প্রতিক বৃষ্টি, সেচ, সার বা বালাইনাশক ব্যবহারের তথ্য।</li></ul>
      <h3>মাঠে প্রাথমিক পর্যবেক্ষণ</h3><p>একটি গাছ দেখে পুরো জমির সিদ্ধান্ত নেবেন না। আক্রান্ত ও সুস্থ গাছ পাশাপাশি দেখুন, জমির বিভিন্ন অংশে লক্ষণ আছে কি না নোট করুন এবং ছবি তুললে পুরো গাছ ও আক্রান্ত অংশের পরিষ্কার ছবি রাখুন। একই লক্ষণ পুষ্টির ঘাটতি, পানি সমস্যা, রোগ বা পোকার কারণে হতে পারে।</p>
      <h3>নিরাপদ ব্যবস্থাপনা</h3><p>সমস্যা নিশ্চিত না হয়ে কীটনাশক প্রয়োগ করবেন না। আক্রান্ত গাছ বা অংশ সরানো, জমি পরিষ্কার রাখা, পানি নিষ্কাশন ও নিয়মিত পর্যবেক্ষণের মতো সাধারণ ব্যবস্থাও ফসল ও সমস্যাভেদে যাচাই করে নিন। কোনো বালাইনাশক ব্যবহার করলে স্থানীয়ভাবে অনুমোদিত পণ্য, লেবেল, সুরক্ষা সরঞ্জাম ও অপেক্ষাকাল মেনে চলুন।</p>
      <h3>কখন বিশেষজ্ঞের সহায়তা নেবেন?</h3><p>দ্রুত রোগ ছড়ালে, গাছ ঢলে পড়লে, ফল/কাণ্ড পচলে, অজানা পোকা দেখা দিলে বা রাসায়নিক ব্যবস্থাপনার প্রয়োজন হলে উপজেলা কৃষি অফিস বা যোগ্য উদ্ভিদ রোগ/বালাই বিশেষজ্ঞের পরামর্শ নিন।</p>
      <h3>AI সহায়তার সীমাবদ্ধতা</h3><p>AI সম্ভাব্য কারণ সাজাতে পারে, কিন্তু ছবি বা বর্ণনা থেকে সব রোগ নির্ভুলভাবে আলাদা করা সম্ভব নয়। নিশ্চিত সিদ্ধান্তের জন্য মাঠ পর্যবেক্ষণ, প্রয়োজন হলে নমুনা পরীক্ষা এবং কৃষি বিশেষজ্ঞের মতামত জরুরি।</p>
      <h3>আরও সহায়তা</h3><ul><li><Link href="/crop-disease">ফসলের রোগ সহায়তা</Link></li><li><Link href="/learn">কৃষি শেখার কেন্দ্র</Link></li><li><Link href="/weather">কৃষি আবহাওয়া</Link></li></ul>
    </article>
  </section></main>;
}
