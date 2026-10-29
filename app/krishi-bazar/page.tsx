import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "কৃষি বাজার বাংলাদেশ: ফসল বিক্রি, কৃষিপণ্য ও বাজারদর",
  description:
    "বাংলাদেশের কৃষক, ক্রেতা ও কৃষি ব্যবসায়ীদের জন্য AGRIVA কৃষি বাজার গাইড। ফসল বিক্রি করুন, কৃষি উপকরণ খুঁজুন, ক্রেতার চাহিদা দেখুন এবং বাজারদর যাচাই করুন।",
  alternates: { canonical: "/krishi-bazar" },
  keywords: [
    "কৃষি বাজার বাংলাদেশ",
    "কৃষিপণ্য বাজার",
    "ফসল বিক্রি",
    "কৃষিপণ্যের বাজারদর",
    "কৃষি পণ্য কেনা",
    "কৃষক ও ক্রেতা",
    "AGRIVA",
  ],
  openGraph: {
    title: "কৃষি বাজার বাংলাদেশ | AGRIVA",
    description:
      "ফসল বিক্রি, কৃষিপণ্য খোঁজা, ক্রেতার চাহিদা দেখা ও বাজারদর যাচাই—কৃষি বাজারের দরকারি পথ এক জায়গায়।",
    url: "/krishi-bazar",
    type: "website",
    locale: "bn_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "কৃষি বাজার বাংলাদেশ | AGRIVA",
    description: "ফসল বিক্রি, কৃষিপণ্য খোঁজা ও বাজারদর যাচাইয়ের ব্যবহারিক গাইড।",
  },
};

const pathways = [
  {
    eyebrow: "কৃষকের জন্য",
    title: "নিজের ফসল বিক্রির পোস্ট দিন",
    description:
      "ফসলের নাম, পরিমাণ, প্রত্যাশিত দাম, অবস্থান ও ছবি দিয়ে বিক্রির তথ্য দিন। ক্রেতার সঙ্গে কথা বলার আগে পরিমাণ, মান, পরিবহন ও পেমেন্টের শর্ত মিলিয়ে নিন।",
    href: "/sell-harvest",
    cta: "ফসল বিক্রি শুরু করুন",
  },
  {
    eyebrow: "ক্রেতা ও কৃষি ব্যবসার জন্য",
    title: "কৃষি পণ্য খুঁজুন",
    description:
      "বীজ, সার, কৃষি উপকরণ ও তালিকাভুক্ত পণ্যের বিবরণ দেখুন। কেনার আগে পণ্যের লেবেল, অনুমোদন, মেয়াদ, সরবরাহ ও বিক্রেতার শর্ত যাচাই করুন।",
    href: "/marketplace",
    cta: "মার্কেটপ্লেস দেখুন",
  },
  {
    eyebrow: "পাইকারি ক্রেতার জন্য",
    title: "ক্রেতার চাহিদা দেখুন",
    description:
      "কোন ফসল, কত পরিমাণ, কোন এলাকায় এবং কখন দরকার—চাহিদার তথ্য দেখে উপযুক্ত হলে নিজের অফার দিন। চূড়ান্ত চুক্তির আগে মান ও সরবরাহের শর্ত নিশ্চিত করুন।",
    href: "/buyer-demands",
    cta: "চাহিদা দেখুন",
  },
  {
    eyebrow: "দাম যাচাইয়ের জন্য",
    title: "বাজারদর ও হিসাব মিলিয়ে নিন",
    description:
      "বাজারদরকে প্রাথমিক নির্দেশক হিসেবে ব্যবহার করুন। এলাকা, মান, মৌসুম, পরিমাণ ও পরিবহন খরচে প্রকৃত লেনদেনের দাম বদলাতে পারে।",
    href: "/market-prices",
    cta: "বাজারদর দেখুন",
  },
];

const faqs = [
  {
    question: "AGRIVA-তে কীভাবে নিজের ফসল বিক্রির জন্য তালিকাভুক্ত করব?",
    answer:
      "ফসল বিক্রির পেজে গিয়ে ফসলের নাম, পরিমাণ, দাম, অবস্থান ও প্রয়োজনীয় বিবরণ দিয়ে পোস্ট তৈরি করুন। প্রকাশের আগে প্রযোজ্য যাচাই বা অনুমোদনের ধাপ সম্পন্ন করুন।",
  },
  {
    question: "AGRIVA Marketplace-এ কি কৃষক ও ব্যবসায়ী একই ধরনের পণ্য বিক্রি করেন?",
    answer:
      "Marketplace মূলত ব্যবসায়িক বিক্রেতাদের কৃষি উপকরণ ও তালিকাভুক্ত পণ্যের জন্য। কৃষকের নিজের উৎপাদিত ফসল বিক্রির জন্য আলাদা Sell Harvest পথ রয়েছে।",
  },
  {
    question: "AGRIVA-তে দেখানো বাজারদর কি নিশ্চিত বিক্রয়মূল্য?",
    answer:
      "না। বাজারদর তুলনা ও পরিকল্পনার সহায়ক তথ্য। স্থানীয় বাজার, পণ্যের মান, পরিমাণ, মৌসুম, পরিবহন এবং ক্রেতা-বিক্রেতার চুক্তি অনুযায়ী প্রকৃত দাম ভিন্ন হতে পারে।",
  },
  {
    question: "কেনার বা বিক্রির আগে কী যাচাই করা উচিত?",
    answer:
      "পণ্যের মান ও পরিমাণ, দাম, সরবরাহের সময়, পরিবহন, পেমেন্টের শর্ত এবং সংশ্লিষ্ট পক্ষের পরিচয় ও যোগাযোগের তথ্য স্পষ্ট করে নিন।",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/krishi-bazar#webpage`,
      url: `${siteUrl}/krishi-bazar`,
      name: "কৃষি বাজার বাংলাদেশ | AGRIVA",
      description:
        "ফসল বিক্রি, কৃষিপণ্য খোঁজা, ক্রেতার চাহিদা দেখা ও বাজারদর যাচাইয়ের ব্যবহারিক গাইড।",
      inLanguage: "bn-BD",
      breadcrumb: { "@id": `${siteUrl}/krishi-bazar#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${siteUrl}/krishi-bazar#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "কৃষি বাজার", item: `${siteUrl}/krishi-bazar` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

export default function KrishiBazarPage() {
  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full border-[48px] border-white/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <nav aria-label="Breadcrumb" className="text-sm text-emerald-50/80">
            <Link href="/" className="underline-offset-4 hover:underline">হোম</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">কৃষি বাজার</span>
          </nav>
          <p className="mt-7 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide">AGRIVA কৃষি বাজার গাইড</p>
          <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            বাংলাদেশের কৃষি বাজারে <span className="text-lime-300">কেনা-বেচার পথ</span> খুঁজুন
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-emerald-50/90 sm:text-lg">
            নিজের ফসল বিক্রি, কৃষি উপকরণ খোঁজা, ক্রেতার চাহিদা দেখা কিংবা বাজারদর যাচাই—আপনার কাজ অনুযায়ী সঠিক সেবায় যান। সিদ্ধান্ত নেওয়ার আগে পণ্যের মান, পরিমাণ, সরবরাহ ও লেনদেনের শর্ত মিলিয়ে নিন।
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/sell-harvest" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-[#17351f] transition hover:bg-lime-200">ফসল বিক্রি করুন</Link>
            <Link href="/marketplace" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/15">কৃষি পণ্য খুঁজুন</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">আপনার প্রয়োজন বেছে নিন</p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">কৃষি বাজারের চারটি দরকারি পথ</h2>
          <p className="mt-3 leading-7 text-slate-600">AGRIVA-র আলাদা সেবাগুলো ব্যবহার করে আপনার পরবর্তী পদক্ষেপ ঠিক করুন। তালিকাভুক্ত পণ্য বা বাজারদরের প্রাপ্যতা সময় ও এলাকার সঙ্গে বদলাতে পারে।</p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {pathways.map((item) => (
            <article key={item.href} className="flex h-full flex-col rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
              <p className="text-xs font-extrabold text-emerald-700">{item.eyebrow}</p>
              <h3 className="mt-2 text-xl font-black">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex min-h-11 items-center self-start rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">{item.cta} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-emerald-100 bg-white py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">লেনদেনের আগে</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">ভালো সিদ্ধান্তের জন্য যাচাই করুন</h2>
            <p className="mt-3 leading-7 text-slate-600">অনলাইন তালিকা যোগাযোগ শুরু করতে সাহায্য করে; চূড়ান্ত চুক্তির আগে তথ্য নিশ্চিত করা জরুরি।</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "পণ্যের মান, জাত, গ্রেড ও পরিমাণ",
              "একক দাম, মোট মূল্য ও অতিরিক্ত খরচ",
              "সরবরাহের সময়, স্থান ও পরিবহন",
              "পেমেন্টের পদ্ধতি ও ফেরত/বাতিলের শর্ত",
            ].map((tip) => <li key={tip} className="flex items-start gap-3 rounded-xl bg-[#f5f8f1] p-4 text-sm font-semibold leading-6"><span aria-hidden="true" className="mt-0.5 text-emerald-700">✓</span><span>{tip}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="text-2xl font-black sm:text-3xl">সাধারণ প্রশ্ন</h2>
        <div className="mt-5 divide-y divide-emerald-100 rounded-2xl border border-emerald-100 bg-white px-5">
          {faqs.map((faq) => <details key={faq.question} className="py-4">
            <summary className="cursor-pointer font-extrabold leading-7 marker:text-emerald-700">{faq.question}</summary>
            <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
          </details>)}
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-500">বাজারদর ও তালিকার তথ্যকে সহায়ক নির্দেশক হিসেবে বিবেচনা করুন; স্থানীয় অবস্থা ও চূড়ান্ত লেনদেনের শর্ত আলাদাভাবে যাচাই করুন।</p>
      </section>
    </main>
  );
}
