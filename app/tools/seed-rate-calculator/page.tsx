import type { Metadata } from "next";
import Link from "next/link";
import SeedRateCalculator from "@/components/tools/SeedRateCalculator";

const faqs = [
  ["সব ফসলের বীজের হার কি একই?", "না। ফসল, জাত, বপন পদ্ধতি, বীজের অঙ্কুরোদ্গম ও বিশুদ্ধতার ওপর প্রয়োজনীয় বীজের পরিমাণ নির্ভর করে।"],
  ["বীজ কেনার আগে কী পরীক্ষা করব?", "জাত, মেয়াদ, লট নম্বর, অঙ্কুরোদ্গম, বিশুদ্ধতা ও প্যাকেট অক্ষত কি না যাচাই করুন।"],
];
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };
export const metadata: Metadata = {
  title: "ফসলভিত্তিক বীজের পরিমাণ হিসাব | AGRIVA",
  description: "ফসল, জমির আয়তন ও বীজের যাচাই করা হার দিয়ে প্রয়োজনীয় বীজের আনুমানিক পরিমাণ হিসাব করুন।",
  alternates: { canonical: "/seed-rate-calculator" },
  robots: { index: false, follow: true },
  keywords: ["বীজের পরিমাণ হিসাব", "ফসলভিত্তিক বীজের হার", "seed rate calculator Bangladesh"],
};

export default function SeedRateCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-9"><p className="text-sm font-bold text-emerald-200">AGRIVA · বীজ পরিকল্পনা</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">বীজের পরিমাণ হিসাব করুন</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">ফসল ও জমির তথ্য দিয়ে বীজের আনুমানিক প্রয়োজন বুঝুন। বপন পদ্ধতি ও বীজের গুণমান অনুযায়ী সঠিক হার যাচাই করুন।</p></header>
    <div className="mt-8"><SeedRateCalculator /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>বীজের পরিমাণ কেন ফসলভেদে বদলায়?</h2><p>ধান, গম, ভুট্টা ও সবজির বীজের আকার, গাছের কাঙ্ক্ষিত ঘনত্ব ও উৎপাদন পদ্ধতি আলাদা। সরাসরি বপন, সারিতে বপন, ছিটিয়ে বপন এবং বীজতলায় চারা তৈরি করে রোপণের ক্ষেত্রেও বীজের প্রয়োজন এক নয়।</p>
      <h3>বীজের হার যাচাইয়ের বিষয়</h3><ul><li>ফসল ও জাতের জন্য নির্দিষ্ট উৎপাদন নির্দেশনা দেখুন।</li><li>অঙ্কুরোদ্গম ও বিশুদ্ধতার হার যাচাই করুন।</li><li>বপন পদ্ধতি, দূরত্ব ও মৌসুম বিবেচনা করুন।</li><li>বীজের প্যাকেটের লট, মেয়াদ ও সংরক্ষণ অবস্থা দেখুন।</li></ul>
      <h3>বীজ কেনার সময় সতর্কতা</h3><p>বিশ্বস্ত বিক্রেতা থেকে বীজ নিন এবং প্যাকেটে জাত, উৎপাদন/মেয়াদ, লট নম্বর ও মানসংক্রান্ত তথ্য মিলিয়ে নিন। অস্বাভাবিক কম অঙ্কুরোদ্গম থাকলে নিজের সিদ্ধান্তে বীজের হার বাড়ানোর বদলে বীজ পরীক্ষা ও স্থানীয় কৃষি পরামর্শ নিন।</p>
      <h3>সীমাবদ্ধতা</h3><p>ক্যালকুলেটরের ফল আপনার দেওয়া জমি ও বীজের হারের ওপর নির্ভর করে। এটি বীজের মান পরীক্ষা করে না এবং সব জাতের জন্য একটি সাধারণ হার সুপারিশ করে না।</p>
      <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
      <p>সূত্র, একক রূপান্তর ও বিস্তারিত ব্যবহারবিধির জন্য <Link href="/seed-rate-calculator">AGRIVA বীজের পরিমাণ হিসাবের পূর্ণ গাইড</Link> দেখুন।</p>
    </article>
  </section></main>;
}
