import type { Metadata } from "next";
import Link from "next/link";
import FarmWorkspace from "@/components/farms/FarmWorkspace";

const pageUrl = "https://agriva.com.bd/farms";

export const metadata: Metadata = {
  title: "আমার খামার: জমি, ফসল, খরচ ও আয় পরিচালনা | AGRIVA",
  description:
    "AGRIVA-তে নিজের জমি ও খামারের তথ্য, ফসলের মৌসুম, মাঠের কাজের ডায়েরি, চাষের খরচ এবং বিক্রির আয় এক জায়গায় সংরক্ষণ ও পর্যালোচনা করুন।",
  alternates: { canonical: pageUrl },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
  openGraph: {
    title: "আমার খামার: জমি, ফসল ও হিসাব রাখুন | AGRIVA",
    description:
      "জমির তথ্য, ফসলের মৌসুম, মাঠের কাজ, খরচ ও বিক্রির আয় গুছিয়ে রাখার ব্যক্তিগত কৃষি ওয়ার্কস্পেস।",
    url: pageUrl,
    siteName: "AGRIVA",
    locale: "bn_BD",
    type: "website",
  },
};

const faqs = [
  {
    question: "AGRIVA-তে কীভাবে নিজের খামার যোগ করব?",
    answer:
      "লগইন করে আমার খামার পেজে খামারের নাম লিখুন। চাইলে জেলা ও জমির পরিমাণ একরে যোগ করে খামার সংরক্ষণ করুন। পরে একই অ্যাকাউন্ট থেকে একাধিক জমি বা খামারের তথ্য রাখতে পারবেন।",
  },
  {
    question: "খামারের ডায়েরিতে কী ধরনের তথ্য লিখব?",
    answer:
      "বীজ বপন বা চারা রোপণ, সেচ, সার প্রয়োগ, আগাছা পরিষ্কার, রোগ-পোকা পর্যবেক্ষণ, শ্রমিকের কাজ, আবহাওয়াজনিত ক্ষতি এবং ফসল কাটার মতো কাজের তারিখসহ সংক্ষিপ্ত বিবরণ লিখুন।",
  },
  {
    question: "ফসলের মৌসুম যোগ করলে কী সুবিধা?",
    answer:
      "ফসলের নাম, জাত, মৌসুম, বপন বা রোপণের তারিখ, সম্ভাব্য কাটার তারিখ এবং নোট একসঙ্গে রাখা যায়। এতে কোন জমিতে কোন ফসলের কোন পর্যায় চলছে তা পরে সহজে মনে করা যায়।",
  },
  {
    question: "AGRIVA-র খরচ ও লাভের হিসাব কি প্রকৃত নিট লাভ দেখায়?",
    answer:
      "এটি আপনার যোগ করা খরচ ও বিক্রির আয় থেকে হিসাব করে: রেকর্ড করা বিক্রি থেকে রেকর্ড করা খরচ বাদ দেয়। জমিভাড়া, পরিবারের শ্রম, ঋণের সুদ বা বাদ পড়া খরচ যোগ না করলে ফল প্রকৃত নিট লাভের সমান নাও হতে পারে।",
  },
  {
    question: "আমার খামারের তথ্য কি অন্য ব্যবহারকারীরা দেখতে পাবেন?",
    answer:
      "খামারের তথ্য ব্যক্তিগত ওয়ার্কস্পেসে দেখানোর জন্য। নিজের অ্যাকাউন্টে লগইন করে তথ্য ব্যবহার করুন এবং শেয়ার করা ডিভাইসে কাজ শেষে লগআউট করুন। কোনো ব্যক্তিগত তথ্য প্রকাশ্যে শেয়ার করার আগে সংশ্লিষ্ট ফিচারের গোপনীয়তা ও শেয়ারিং সেটিং যাচাই করুন।",
  },
  {
    question: "খামারের তথ্য দিয়ে কি AGRIVA স্বয়ংক্রিয়ভাবে কৃষি পরামর্শ দেয়?",
    answer:
      "এই পেজ মূলত আপনার দেওয়া তথ্য সংরক্ষণ ও হিসাব গুছিয়ে রাখতে সাহায্য করে। বীজ, সার, সেচ, রোগবালাই বা বালাইনাশকের নির্দিষ্ট সিদ্ধান্তের জন্য মাটি, ফসল, জাত, এলাকা ও মৌসুম বিবেচনা করে কৃষি কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন।",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": pageUrl + "#webpage",
      url: pageUrl,
      name: "আমার খামার: জমি, ফসল, খরচ ও আয় পরিচালনা",
      description: "AGRIVA-র ব্যক্তিগত খামার ব্যবস্থাপনা ওয়ার্কস্পেস ব্যবহারের নির্দেশনা।",
      inLanguage: "bn-BD",
      isPartOf: { "@id": "https://agriva.com.bd/#website" },
      breadcrumb: { "@id": pageUrl + "#breadcrumb" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": pageUrl + "#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: "https://agriva.com.bd/" },
        { "@type": "ListItem", position: 2, name: "আমার খামার", item: pageUrl },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": pageUrl + "#faq",
      inLanguage: "bn-BD",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function FarmsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <FarmWorkspace />

      <section className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-700">
            AGRIVA · Farm management guide
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
            ডিজিটাল খামার ব্যবস্থাপনা: জমি, ফসল ও হিসাব গুছিয়ে রাখুন
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            একাধিক জমিতে চাষ করলে কোন জমিতে কী ফসল আছে, কখন সেচ বা সার দেওয়া হয়েছে,
            কত টাকা খরচ হয়েছে এবং কত টাকায় ফসল বিক্রি হয়েছে—এসব তথ্য মনে রাখা কঠিন।
            AGRIVA-র আমার খামার ওয়ার্কস্পেসে নিজের দেওয়া তথ্য এক জায়গায় সংরক্ষণ করে
            মৌসুমভিত্তিক কাজ ও হিসাব পর্যালোচনা করতে পারবেন।
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["জমি ও খামারের তালিকা", "প্রতিটি জমির নাম, জেলা ও আয়তন একরে লিখে আলাদা রেকর্ড তৈরি করুন।"],
              ["ফসল ও মৌসুম", "ফসলের নাম, জাত, আউশ-আমন-বোরো বা অন্য মৌসুম এবং বপন ও সম্ভাব্য কাটার তারিখ রাখুন।"],
              ["মাঠের কাজের ডায়েরি", "সেচ, বীজ বপন, সার প্রয়োগ, পরিচর্যা, রোগ-পোকা পর্যবেক্ষণ ও অন্যান্য কাজ তারিখসহ লিখুন।"],
              ["খরচের হিসাব", "বীজ, সার, বালাইনাশক, শ্রমিক, সেচ, যন্ত্রপাতি ও পরিবহনের খরচ আলাদা করে নথিবদ্ধ করুন।"],
              ["বিক্রির আয়", "ফসল বিক্রির বিবরণ, তারিখ ও পাওয়া অর্থ লিখে খরচের সঙ্গে তুলনা করুন।"],
              ["মৌসুম শেষে পর্যালোচনা", "কোন ফসলে কত খরচ ও বিক্রি হয়েছে, কোন কাজের সময় বা ইনপুট বাদ পড়েছে—রেকর্ড দেখে মিলিয়ে নিন।"],
            ].map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <h3 className="font-extrabold text-emerald-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">
              খামারের রেকর্ড রাখার সহজ পদ্ধতি
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                ["১. জমি যোগ করে পরিচিত নাম দিন", "একই নামে একাধিক জমি না রেখে গ্রাম, দাগ বা স্থানীয় পরিচিতি দিয়ে আলাদা নাম দিন। জমির আয়তন একরে লিখুন; অন্য এককে মাপ জানা থাকলে আগে একক রূপান্তর করে নিন।"],
                ["২. ফসলের মৌসুম শুরুতেই নথি খুলুন", "ফসল, জাত, মৌসুম ও বপন/রোপণের তারিখ লিখুন। সম্ভাব্য কাটার তারিখকে পরিকল্পনা হিসেবে রাখুন—আবহাওয়া, জাত ও মাঠের অবস্থায় সময় বদলাতে পারে।"],
                ["৩. কাজের দিনেই ডায়েরি লিখুন", "কী কাজ করেছেন, কোন জমিতে করেছেন, কখন করেছেন এবং প্রয়োজন হলে কী পর্যবেক্ষণ করেছেন—সংক্ষিপ্ত কিন্তু নির্দিষ্টভাবে লিখুন।"],
                ["৪. প্রতিটি খরচ ও বিক্রি আলাদা করে যোগ করুন", "তারিখ, বিবরণ, খরচের ধরন ও টাকার পরিমাণ লিখুন। সম্ভব হলে রসিদ বা লেনদেনের তথ্য নিজের কাছে সংরক্ষণ করুন।"],
                ["৫. মৌসুম শেষে হিসাব যাচাই করুন", "মোট খরচ ও বিক্রির আয় তুলনা করুন। জমিভাড়া, পরিবারের শ্রম, ঋণের সুদ, সংরক্ষণ ও পরিবহনের মতো খরচ বাদ পড়েছে কি না যাচাই করুন।"],
              ].map(([title, description]) => (
                <li key={title} className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12 rounded-3xl bg-[#124c35] p-6 text-white sm:p-8">
            <h2 className="text-xl font-black sm:text-2xl">খরচ ও লাভের হিসাব বুঝে নিন</h2>
            <p className="mt-3 leading-7 text-emerald-50/85">
              AGRIVA-র হিসাব অংশে নির্বাচিত খামারের রেকর্ড করা মোট খরচ, মোট বিক্রি এবং
              বিক্রি থেকে খরচ বাদ দেওয়া ফল দেখানো হয়। এটি আপনার দেওয়া তথ্যনির্ভর হিসাব;
              বাজারদর, ফলন বা ভবিষ্যৎ লাভের পূর্বাভাস নয়।
            </p>
            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">সহজ হিসাব</p>
              <p className="mt-1 text-lg font-black">রেকর্ড করা বিক্রির আয় − রেকর্ড করা খরচ = হিসাবের নিট ফল</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-emerald-50/75">
              প্রকৃত লাভ বুঝতে জমিভাড়া, নিজের ও পরিবারের শ্রম, ঋণের সুদ, যন্ত্রপাতির অবচয়,
              সংরক্ষণ, অপচয় ও অন্যান্য বাদ পড়া খরচও বিবেচনা করুন।
            </p>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">
              খামার পরিকল্পনায় আরও যে বিষয়গুলো খেয়াল রাখবেন
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
              <li>জমির ধরন, পানি নিষ্কাশন, সেচের সুবিধা ও স্থানীয় আবহাওয়া অনুযায়ী ফসল নির্বাচন করুন।</li>
              <li>সার প্রয়োগের আগে সম্ভব হলে মাটি পরীক্ষা এবং ফসলভিত্তিক সরকারি সুপারিশ অনুসরণ করুন।</li>
              <li>রোগ বা পোকা দেখা দিলে লক্ষণ, তারিখ ও আক্রান্ত জমির তথ্য লিখুন; নিশ্চিত না হয়ে বালাইনাশক প্রয়োগ করবেন না।</li>
              <li>বীজ, সার ও অন্যান্য উপকরণের ক্রয় রসিদ এবং বিক্রির প্রমাণ নিজের কাছে রাখুন।</li>
              <li>ফসল কাটার পর ফলন, বিক্রির পরিমাণ, গ্রেড, দাম ও পরিবহন খরচ নথিবদ্ধ করুন।</li>
            </ul>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              কৃষি সম্প্রসারণ অধিদপ্তরের নির্দেশনা ও স্থানীয় পরামর্শকে অগ্রাধিকার দিন।
              ডায়েরির রেকর্ড আপনাকে নিজের খামারের ইতিহাস বুঝতে সাহায্য করবে, তবে এটি
              মাঠপর্যায়ের কৃষি পরামর্শের বিকল্প নয়।
            </p>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">AGRIVA-র সম্পর্কিত কৃষি টুলস ও গাইড</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href="/tools/crop-calendar" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">ফসল ক্যালেন্ডার <span className="mt-1 block text-sm font-normal text-slate-500">মৌসুম ও ফসলের কাজের সময় পরিকল্পনা করুন।</span></Link>
              <Link href="/farming-cost-profit-calculator" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">চাষের খরচ ও লাভ ক্যালকুলেটর <span className="mt-1 block text-sm font-normal text-slate-500">নিজের অনুমান ও বাজারদর দিয়ে আগাম হিসাব করুন।</span></Link>
              <Link href="/fertilizer-calculator" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">সার ক্যালকুলেটর <span className="mt-1 block text-sm font-normal text-slate-500">জমির পরিমাণ ও সুপারিশ অনুযায়ী সার হিসাব করুন।</span></Link>
              <Link href="/learn" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">কৃষি শেখার কেন্দ্র <span className="mt-1 block text-sm font-normal text-slate-500">ফসল, মাটি ও সমন্বিত বালাই ব্যবস্থাপনা সম্পর্কে জানুন।</span></Link>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">সাধারণ প্রশ্ন ও উত্তর</h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-5">
                  <summary className="cursor-pointer list-none pr-6 font-bold text-slate-900 marker:hidden">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-extrabold text-amber-950">তথ্যসূত্র ও কৃষি পরামর্শ</h2>
            <p className="mt-2 text-sm leading-7 text-amber-950/80">
              ফসল নির্বাচন, উৎপাদন প্রযুক্তি ও কৃষি ব্যবস্থাপনার বিষয়ে সরকারি তথ্য যাচাই করুন।
              স্থানীয় মাটি, জাত, মৌসুম ও আবহাওয়ার ভিত্তিতে প্রয়োজনীয় পরামর্শ নিন।
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li><a className="font-semibold text-emerald-800 underline" href="https://dae.gov.bd/" target="_blank" rel="noreferrer">কৃষি সম্প্রসারণ অধিদপ্তর (DAE)</a> — সরকারি কৃষি নির্দেশনা ও সেবা।</li>
              <li><a className="font-semibold text-emerald-800 underline" href="https://dae.gov.bd/sites/default/files/files/dae.portal.gov.bd/publications/38eaceb4_db27_48ff_83e1_8b45b01b6a79/Extension_Mannual_Chapt1.pdf" target="_blank" rel="noreferrer">DAE Agricultural Extension Manual</a> — কৃষক ও মাঠপর্যায়ের সম্প্রসারণ কার্যক্রমে তথ্য ও সমস্যা নথিবদ্ধ করার প্রেক্ষাপট।</li>
              <li><a className="font-semibold text-emerald-800 underline" href="https://moa.gov.bd/" target="_blank" rel="noreferrer">কৃষি মন্ত্রণালয়</a> — কৃষি খাতের নীতি ও সরকারি সংস্থার তথ্য।</li>
            </ul>
          </aside>

          <p className="mt-8 text-xs leading-6 text-slate-500">
            গোপনীয়তা: এই পেজের খামার, ফসল, ডায়েরি ও আর্থিক রেকর্ড ব্যক্তিগত ব্যবহারের জন্য।
            অ্যাকাউন্ট সুরক্ষিত রাখুন এবং অন্যের ডিভাইসে লগইন করলে কাজ শেষে লগআউট করুন।
            AGRIVA-র হিসাব আপনার সংরক্ষিত তথ্যের ওপর নির্ভরশীল; অসম্পূর্ণ রেকর্ড হলে ফলও অসম্পূর্ণ হবে।
          </p>
        </div>
      </section>
    </>
  );
}
