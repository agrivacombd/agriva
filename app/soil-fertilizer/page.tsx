import type { Metadata } from "next";
import Link from "next/link";
import SoilFertilizerPlanner from "@/components/tools/SoilFertilizerPlanner";

const pageUrl = "https://agriva.com.bd/soil-fertilizer";
const faqs = [
  ["মাটি পরীক্ষা ছাড়া কি সারের পরিকল্পনা করা উচিত?", "মাটি পরীক্ষা ছাড়া নির্দিষ্ট পুষ্টি ঘাটতি বা সারের মাত্রা নিশ্চিত করা যায় না। সম্ভব হলে স্বীকৃত পরীক্ষাগারে মাটি পরীক্ষা করান এবং স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।"],
  ["মাটি পরীক্ষার রিপোর্টে pH কম বা বেশি হলে কী বোঝায়?", "pH মাটির অম্লতা বা ক্ষারত্ব বোঝায়। উপযুক্ত pH ফসল ও মাটির ধরনভেদে বদলায়; শুধু pH দেখে নিজে থেকে চুন বা অন্য উপাদান প্রয়োগ করবেন না।"],
  ["NPK-এর মান কি সরাসরি ইউরিয়া, TSP ও MOP-এর কেজি?", "না। N, P ও K পুষ্টি উপাদানের মাত্রা এবং বাজারের সার পণ্যের ওজন এক জিনিস নয়। পুষ্টি সুপারিশকে পণ্যভিত্তিক মাত্রায় রূপান্তরের জন্য নির্ভরযোগ্য নির্দেশিকা দরকার।"],
];
export const metadata: Metadata = {
  title: "মাটি পরীক্ষা ও সার পরিকল্পনাকারী",
  description: "মাটি পরীক্ষার রিপোর্ট, pH ও পুষ্টি উপাদানের তথ্য বুঝে সার পরিকল্পনা সাজান। ফলাফল যাচাই, একক ও নিরাপদ প্রয়োগের গুরুত্বপূর্ণ নির্দেশনা জানুন।",
  alternates: { canonical: pageUrl },
  openGraph: { title: "মাটি পরীক্ষা ও সার পরিকল্পনাকারী | AGRIVA", description: "মাটি পরীক্ষার তথ্য ও কৃষি কর্মকর্তার সুপারিশ ধরে সার পরিকল্পনা করুন।", url: pageUrl, type: "website", locale: "bn_BD" },
  keywords: ["মাটি পরীক্ষা", "মাটি ও সার পরিকল্পনা", "মাটির pH", "NPK সার হিসাব", "soil fertilizer planner Bangladesh"],
};
const faqJsonLd = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity: faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}})) };

export default function SoilFertilizerPage() {
  return <main className="min-h-screen bg-[#f6faf7] text-[#17351f]">
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}} />
      <header className="mb-8 rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10">
        <p className="text-sm font-bold text-emerald-200">AGRIVA · মাটি ও পুষ্টি ব্যবস্থাপনা</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">মাটি পরীক্ষা ও সার পরিকল্পনাকারী</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">মাটি পরীক্ষার রিপোর্ট বা কৃষি কর্মকর্তার যাচাই করা সুপারিশের তথ্য ব্যবহার করে পুষ্টি ব্যবস্থাপনার হিসাব গুছিয়ে নিন। ফলাফলকে মাঠের অবস্থা ও ফসলভিত্তিক নির্দেশনার সঙ্গে মিলিয়ে নিন।</p>
      </header>
      <SoilFertilizerPlanner />
      <article className="agriva-seo-content mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9">
        <h2>মাটি পরীক্ষার ফল দিয়ে সার পরিকল্পনা কেন জরুরি?</h2>
        <p>একই এলাকার জমিতেও মাটির গঠন, অম্লতা, জৈব পদার্থ ও পুষ্টি উপাদানের পরিমাণ আলাদা হতে পারে। অনুমান করে একই মাত্রায় সার দিলে কোনো জমিতে ঘাটতি থেকে যেতে পারে, আবার কোথাও অপ্রয়োজনীয় প্রয়োগ হতে পারে। মাটি পরীক্ষার রিপোর্ট জমির বর্তমান অবস্থা বুঝতে সাহায্য করে।</p>
        <h3>রিপোর্ট পড়ার সময় যে তথ্যগুলো দেখবেন</h3>
        <ul><li><strong>pH:</strong> মাটি অম্লীয়, নিরপেক্ষ নাকি ক্ষারীয়—তার একটি সূচক।</li><li><strong>জৈব পদার্থ:</strong> মাটির গুণাগুণ ও পানি-পুষ্টি ধারণের সঙ্গে সম্পর্কিত।</li><li><strong>প্রধান পুষ্টি:</strong> নাইট্রোজেন, ফসফরাস ও পটাশিয়ামসহ রিপোর্টে থাকা উপাদানগুলোর মান ও একক পড়ুন।</li><li><strong>নমুনার পরিচয়:</strong> নমুনা কোন জমি, গভীরতা ও তারিখ থেকে নেওয়া হয়েছে তা মিলিয়ে নিন।</li></ul>
        <h3>মাটির নমুনা সংগ্রহে সতর্কতা</h3>
        <p>একটি জমির বিভিন্ন অংশে মাটির অবস্থা ভিন্ন হলে প্রতিনিধিত্বমূলক কয়েকটি স্থান থেকে নির্দেশনা অনুযায়ী নমুনা নিন। সার, গোবরের স্তূপ, সেচনালা, জমির কিনারা বা অস্বাভাবিক স্থানের মাটি আলাদা করে বিবেচনা করুন। নমুনা সংগ্রহের পদ্ধতি ও গভীরতা পরীক্ষাগার বা কৃষি অফিসের নির্দেশনা অনুযায়ী ঠিক করুন।</p>
        <h3>পুষ্টি উপাদান ও সার পণ্যের পার্থক্য</h3>
        <p>রিপোর্টে পুষ্টি উপাদানের মান এবং বাজারে কেনা সার পণ্যের ওজন এক নয়। ইউরিয়া, TSP, MOP, জিপসাম বা জিংক সার ভিন্ন পুষ্টি সরবরাহ করে। তাই N-P-K-এর সুপারিশকে সরাসরি সার পণ্যের কেজি ধরে নেবেন না; নির্ভরযোগ্য রূপান্তর নির্দেশিকা ব্যবহার করুন।</p>
        <h3>বিশ্বস্ত নির্দেশনা কোথায় পাবেন?</h3>
        <p><a href="https://barc.gov.bd/" target="_blank" rel="noreferrer">বাংলাদেশ কৃষি গবেষণা কাউন্সিল (BARC)</a>, <a href="https://portal.cropzoning.gov.bd/" target="_blank" rel="noreferrer">কৃষি পরামর্শক বাতায়ন</a> এবং উপজেলা কৃষি অফিসের ফসলভিত্তিক সুপারিশ মিলিয়ে দেখুন। সার প্রয়োগের সময়, ভাগ, পদ্ধতি ও মাত্রা ফসল, জাত, মৌসুম এবং জমির অবস্থার ওপর নির্ভর করে।</p>
        <h3>এই পরিকল্পনাকারীর সীমাবদ্ধতা</h3>
        <p>টুলে দেওয়া তথ্যের ভিত্তিতে পরিকল্পনা সাজানো যায়; এটি মাটি পরীক্ষাগারের বিকল্প নয়, রোগ নির্ণয় করে না এবং সব জমির জন্য স্বয়ংক্রিয়ভাবে সার সুপারিশ নিশ্চিত করে না। রিপোর্টের একক, ফসলের পরিচয় ও সুপারিশের উৎস যাচাই করুন।</p>
        <h2>সাধারণ প্রশ্ন</h2>{faqs.map(([q,a])=><section key={q}><h3>{q}</h3><p>{a}</p></section>)}
        <h3>সম্পর্কিত AGRIVA টুল</h3><ul><li><Link href="/fertilizer-calculator">সার হিসাব ক্যালকুলেটর</Link></li><li><Link href="/seed-rate-calculator">বীজের পরিমাণ ক্যালকুলেটর</Link></li><li><Link href="/farming-cost-profit-calculator">চাষের খরচ ও লাভ হিসাব</Link></li></ul>
      </article>
    </div>
  </main>;
}
