import type { Metadata } from "next";
import Link from "next/link";
import IrrigationWaterCalculator from "@/components/tools/IrrigationWaterCalculator";

const pageUrl = "https://agriva.com.bd/tools/irrigation-water-calculator";
const faqs = [
  ["ক্যালকুলেটরের ফল কি জমির জন্য সঠিক সেচের পরিমাণ?", "না। এটি ইনপুটের ভিত্তিতে পরিকল্পনামূলক অনুমান। মাটির আর্দ্রতা, ফসলের বৃদ্ধি পর্যায়, বৃষ্টিপাত, মাটির ধরন ও সেচ পদ্ধতি দেখে প্রয়োগের সিদ্ধান্ত নিন।"],
  ["সেচের দক্ষতা কম হলে পানির হিসাব কেন বাড়ে?", "একই পরিমাণ পানি শিকড় অঞ্চলে পৌঁছাতে কম দক্ষ ব্যবস্থায় পরিবহন ও প্রয়োগের সময় বেশি পানি হারাতে পারে। তাই দক্ষতা কম হলে প্রয়োজনীয় উৎস-পানির হিসাব বাড়ে।"],
  ["বৃষ্টির আগে কি সেচ দেওয়া বন্ধ রাখতে হবে?", "শুধু বৃষ্টির সম্ভাবনা দেখে সিদ্ধান্ত নেবেন না। সম্ভাব্য বৃষ্টির পরিমাণ, জমির বর্তমান আর্দ্রতা, পানি নিষ্কাশন ও ফসলের পর্যায় বিবেচনা করুন।"],
];
export const metadata: Metadata = {
  title: "সেচের পানির পরিমাণ ক্যালকুলেটর | AGRIVA",
  description: "জমির আয়তন, ফসলের পানির চাহিদা ও সেচের দক্ষতা দিয়ে আনুমানিক সেচের পানির পরিমাণ হিসাব করুন। সূত্র, একক ও মাঠপর্যায়ের সতর্কতা জানুন।",
  alternates: { canonical: pageUrl },
  openGraph: { title: "সেচের পানির হিসাব | AGRIVA", description: "ফসল ও জমির তথ্য দিয়ে সেচের পানির আনুমানিক পরিমাণ বের করুন।", url: pageUrl, type: "website", locale: "bn_BD" },
  keywords: ["সেচের পানির হিসাব", "সেচ ক্যালকুলেটর", "কৃষি সেচের পানি", "irrigation water calculator Bangladesh"],
};
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };

export default function IrrigationWaterCalculatorPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-9"><p className="text-sm font-bold text-emerald-200">AGRIVA · পানি ব্যবস্থাপনা</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">সেচের পানির পরিমাণ হিসাব করুন</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">জমির আয়তন, ফসলের পানির চাহিদা ও সেচ পদ্ধতির দক্ষতা দিয়ে একটি প্রাথমিক পরিকল্পনা-হিসাব তৈরি করুন। মাঠের মাটির আর্দ্রতা ও আবহাওয়ার সঙ্গে ফল মিলিয়ে নিন।</p></header>
    <div className="mt-8"><IrrigationWaterCalculator /></div>
    <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 sm:p-9">
      <h2>সেচের পানির চাহিদা কোন বিষয়গুলোর ওপর নির্ভর করে?</h2><p>ফসলের ধরন ও বৃদ্ধি পর্যায়, তাপমাত্রা, বাতাস, আর্দ্রতা, সাম্প্রতিক বৃষ্টি, মাটির পানি ধারণক্ষমতা এবং সেচ ব্যবস্থার দক্ষতা—সবকিছু মিলিয়ে সেচের প্রয়োজন বদলায়। একই জমিতে চারা, ফুল আসা ও দানা/ফল গঠনের পর্যায়ে পানির প্রয়োজন এক নাও হতে পারে।</p>
      <h3>হিসাবের ধারণা</h3><p>প্রাথমিকভাবে পানির আয়তন নির্ণয়ে জমির ক্ষেত্রফল ও পানির গভীরতা ব্যবহার করা হয়। ১ হেক্টর জমিতে ১ মিলিমিটার পানির স্তর ≈ ১০ ঘনমিটার বা ১০,০০০ লিটার। সেচের দক্ষতা ১০০% না হলে উৎস থেকে সরবরাহের পরিমাণ শিকড় অঞ্চলে পৌঁছানোর প্রয়োজনের চেয়ে বেশি হতে পারে। এই সম্পর্কটি পরিকল্পনার জন্য; প্রকৃত মাঠ-চাহিদা মাটির আর্দ্রতা ও ফসলের অবস্থার ভিত্তিতে ঠিক করতে হবে।</p>
      <h3>সেচ দেওয়ার আগে মাঠে যা যাচাই করবেন</h3><ul><li>শিকড়ের সক্রিয় অঞ্চলে মাটির আর্দ্রতা পরীক্ষা করুন।</li><li>সাম্প্রতিক বৃষ্টি ও স্বল্পমেয়াদি পূর্বাভাস দেখুন।</li><li>জমিতে পানি জমে থাকা, নালা বন্ধ থাকা বা পানি বের হওয়ার সমস্যা আছে কি না দেখুন।</li><li>ফসলের বৃদ্ধি পর্যায় ও স্থানীয় কৃষি কর্মকর্তার পরামর্শ বিবেচনা করুন।</li></ul>
      <h3>পানি সাশ্রয়ের ব্যবহারিক উপায়</h3><p>সমতল ও উপযুক্ত জমি প্রস্তুত, লিকেজ মেরামত, নালা পরিষ্কার রাখা, প্রয়োজনমতো সেচ দেওয়া এবং জমির আর্দ্রতা পর্যবেক্ষণ পানির অপচয় কমাতে সাহায্য করে। সব ফসলের জন্য একই সেচ-ব্যবধান অনুসরণ করবেন না।</p>
      <h3>সীমাবদ্ধতা</h3><p>এই ক্যালকুলেটর স্থানীয় আবহাওয়া স্টেশন, মাটির সেন্সর বা ফসলের evapotranspiration নিজে থেকে মাপে না। প্রদর্শিত ফলকে নিশ্চিত সেচ নির্দেশনা না ধরে প্রাথমিক অনুমান হিসেবে ব্যবহার করুন।</p>
      <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
      <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/weather">কৃষি আবহাওয়া</Link></li><li><Link href="/soil-fertilizer">মাটি ও সার পরিকল্পনাকারী</Link></li><li><Link href="/tools/crop-calendar">ফসল ক্যালেন্ডার</Link></li></ul>
    </article>
  </section></main>;
}
