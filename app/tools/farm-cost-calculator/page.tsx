import type { Metadata } from "next";
import Link from "next/link";
import FarmCostCalculator from "@/components/tools/FarmCostCalculator";

const pageUrl = "https://agriva.com.bd/tools/farm-cost-calculator";
const faqs = [
  ["খরচের হিসাব কি প্রতি একর ও প্রতি কেজিতে দেখা যায়?", "টুলে প্রদর্শিত ফল ও ইনপুটের একক অনুসরণ করুন। প্রতি কেজির খরচ বের করতে মোট খরচকে বিক্রয়যোগ্য উৎপাদন দিয়ে ভাগ করতে হয়।"],
  ["পরিবারের সদস্যের শ্রম কি খরচে ধরব?", "হ্যাঁ। পরিবারের শ্রমের জন্য নগদ মজুরি না দিলেও তুলনামূলক লাভ-লোকসান বুঝতে সেই শ্রমের যুক্তিসঙ্গত মূল্য খরচে ধরা ভালো।"],
  ["জমির ভাড়া ও পরিবহন খরচ যোগ করা উচিত?", "হ্যাঁ। উৎপাদনের সঙ্গে সম্পর্কিত জমির ভাড়া, পরিবহন, প্যাকেজিং, সংরক্ষণ ও বাজারজাতকরণের খরচ অন্তর্ভুক্ত করলে হিসাব পূর্ণ হয়।"],
];
export const metadata: Metadata = {
  title: "চাষের খরচ ক্যালকুলেটর | প্রতি একর ও কেজির খরচ | AGRIVA",
  description: "বীজ, সার, শ্রম, সেচ, জমি প্রস্তুতি, পরিবহন ও অন্যান্য খরচ যোগ করে মোট কৃষি উৎপাদন ব্যয় এবং এককপ্রতি খরচ হিসাব করুন।",
  alternates: { canonical: pageUrl },
  openGraph: { title: "চাষের খরচ হিসাব | AGRIVA", description: "ফসল উৎপাদনের খরচের খাতগুলো গুছিয়ে মোট ব্যয় বুঝুন।", url: pageUrl, type: "website", locale: "bn_BD" },
  keywords: ["চাষের খরচ", "কৃষি উৎপাদন ব্যয়", "প্রতি একরে চাষের খরচ", "প্রতি কেজি উৎপাদন খরচ", "farm cost calculator Bangladesh"],
};
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };

export default function FarmCostCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-9"><p className="text-sm font-bold text-emerald-200">AGRIVA · খামারের হিসাব</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">চাষের মোট খরচ হিসাব করুন</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">ফসল উৎপাদনের প্রতিটি খরচের খাত লিখে মোট ব্যয় ও এককপ্রতি খরচ বুঝুন। নিজের প্রকৃত রসিদ, মজুরি ও ইনপুট মূল্য ব্যবহার করুন।</p></header>
    <div className="mt-8"><FarmCostCalculator /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>চাষের খরচ কীভাবে হিসাব করবেন?</h2><p>একটি মৌসুমের শুরু থেকে ফসল বিক্রি বা ঘরে তোলা পর্যন্ত উৎপাদনের সঙ্গে সম্পর্কিত সব ব্যয় লিখে রাখুন। শুধু বীজ ও সার নয়—জমি প্রস্তুতি, সেচ, শ্রম, যন্ত্র, জমির ভাড়া ও বাজারজাতকরণও মোট খরচে প্রভাব ফেলে।</p>
      <h3>খরচের তালিকা তৈরি করুন</h3><ul><li><strong>জমি প্রস্তুতি:</strong> চাষ, মই, বেড তৈরি ও জমি সমতল করার খরচ।</li><li><strong>উপকরণ:</strong> বীজ, চারা, সার, জৈব উপাদান ও অনুমোদিত বালাইনাশক।</li><li><strong>শ্রম:</strong> বপন, রোপণ, আগাছা দমন, পরিচর্যা, কাটাই ও মাড়াই।</li><li><strong>পানি ও শক্তি:</strong> সেচ, পাম্প, জ্বালানি ও বিদ্যুৎ।</li><li><strong>বিক্রয়-পরবর্তী:</strong> বাছাই, প্যাকেজিং, পরিবহন, বাজার ফি ও সংরক্ষণ।</li></ul>
      <h3>প্রতি একর ও প্রতি কেজির খরচ</h3><p>মোট ব্যয়কে জমির একর দিয়ে ভাগ করলে প্রতি একরের গড় ব্যয় পাওয়া যায়। মোট ব্যয়কে বিক্রয়যোগ্য উৎপাদনের কেজি দিয়ে ভাগ করলে প্রতি কেজির গড় উৎপাদন খরচ পাওয়া যায়। উৎপাদনের যে অংশ নষ্ট বা বিক্রির অযোগ্য, সেটি বাদ দিয়ে বিক্রয়যোগ্য পরিমাণ ব্যবহার করলে বাজারের সঙ্গে তুলনা বেশি বাস্তবসম্মত হয়।</p>
      <h3>রেকর্ড রাখার অভ্যাস</h3><p>প্রতিটি খরচের তারিখ, পরিমাণ, একক, সরবরাহকারী ও রসিদ সংরক্ষণ করুন। নগদ ও বাকির খরচ আলাদা লিখুন এবং পরিবারের শ্রমের আনুমানিক মূল্যও বিবেচনা করুন। এতে পরের মৌসুমে খরচ তুলনা ও পরিকল্পনা সহজ হবে।</p>
      <h3>সীমাবদ্ধতা</h3><p>এই টুল আপনার দেওয়া তথ্য যোগ করে; এটি বাজারদর যাচাই করে না, অনুপস্থিত খরচ অনুমান করে না এবং লাভের নিশ্চয়তা দেয় না। একই জমি ও একই মৌসুমের খরচ তুলনা করুন।</p>
      <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
      <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/tools/crop-profit-calculator">ফসলের লাভ-লোকসান ক্যালকুলেটর</Link></li><li><Link href="/farming-cost-profit-calculator">চাষের খরচ ও লাভ ক্যালকুলেটর</Link></li><li><Link href="/farms">আমার খামার</Link></li></ul>
    </article>
  </section></main>;
}
