import type { Metadata } from "next";
import Link from "next/link";
import FertilizerCalculator from "@/components/tools/FertilizerCalculator";

const faqs = [
  ["সব জমিতে কি একই সার প্রয়োগ করা যায়?", "না। ফসল, জাত, মাটির পরীক্ষার ফল, মৌসুম ও উৎপাদন লক্ষ্যমাত্রা অনুযায়ী সার ব্যবস্থাপনা বদলায়।"],
  ["সারের হিসাবের আগে মাটি পরীক্ষা দরকার?", "সম্ভব হলে মাটি পরীক্ষা করানো ভালো। এতে মাটির pH ও পুষ্টি উপাদানের অবস্থা বুঝে সুপারিশ নেওয়া যায়।"],
];
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };
export const metadata: Metadata = {
  title: "ফসলভিত্তিক সার হিসাব টুল | AGRIVA",
  description: "ফসল ও জমির তথ্য দিয়ে সার পরিকল্পনার হিসাব দেখুন। মাটি পরীক্ষা, BARC নির্দেশনা ও নিরাপদ প্রয়োগের বিষয়গুলো যাচাই করুন।",
  alternates: { canonical: "/fertilizer-calculator" },
  robots: { index: false, follow: true },
  keywords: ["ফসলভিত্তিক সার হিসাব", "fertilizer calculator Bangladesh", "সার পরিকল্পনা"],
};

export default function FertilizerCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-9"><p className="text-sm font-bold text-emerald-200">AGRIVA · কৃষি হিসাব</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">ফসলভিত্তিক সার হিসাব</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">ফসল ও জমির তথ্য দিয়ে প্রাথমিক সার পরিকল্পনার হিসাব দেখুন। প্রয়োগের আগে মাটি পরীক্ষা ও স্থানীয় কৃষি কর্মকর্তার সুপারিশ মিলিয়ে নিন।</p></header>
    <div className="mt-8"><FertilizerCalculator /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>সারের হিসাবের আগে কী যাচাই করবেন?</h2><p>ফসলের পুষ্টি চাহিদা একরকম নয়। মাটির pH, জৈব পদার্থ, পূর্ববর্তী ফসল, সেচের অবস্থা এবং জমির উৎপাদন লক্ষ্যমাত্রা বিবেচনায় সার ব্যবস্থাপনা নির্ধারণ করতে হয়। মাটি পরীক্ষার রিপোর্ট ও স্বীকৃত কৃষি নির্দেশনা ছাড়া কোনো সাধারণ হারকে সব জমির জন্য প্রযোজ্য ভাববেন না।</p>
      <h3>সার ব্যবস্থাপনার মূল বিষয়</h3><ul><li>ফসল, জাত ও মৌসুম অনুযায়ী সুপারিশ যাচাই করুন।</li><li>সারের পণ্যের নাম ও পুষ্টি উপাদানের একক আলাদা করে বুঝুন।</li><li>প্রয়োগের সময়, ভাগ ও পদ্ধতি ফসলভিত্তিক নির্দেশনা অনুযায়ী ঠিক করুন।</li><li>সারের প্যাকেটের লেবেল ও নিরাপত্তা নির্দেশনা অনুসরণ করুন।</li></ul>
      <h3>বিশ্বস্ত উৎস</h3><p><a href="https://barc.gov.bd/" target="_blank" rel="noreferrer">BARC</a> ও <a href="https://portal.cropzoning.gov.bd/" target="_blank" rel="noreferrer">কৃষি পরামর্শক বাতায়ন</a> থেকে প্রাসঙ্গিক নির্দেশনা খুঁজুন। প্রয়োজনে উপজেলা কৃষি অফিসে যোগাযোগ করুন।</p>
      <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
      <p>বিস্তারিত সূত্র, একক রূপান্তর ও ব্যবহারবিধির জন্য <Link href="/fertilizer-calculator">AGRIVA সার হিসাবের পূর্ণ গাইড</Link> দেখুন।</p>
    </article>
  </section></main>;
}
