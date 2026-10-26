import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = `${siteUrl}/green-exchange`;

export const metadata: Metadata = {
  title: "গাছ বিনিময় বাংলাদেশ | Green Exchange – AGRIVA",
  description:
    "বাংলাদেশের শখের বাগানিদের জন্য গাছ, চারা, কাটিং ও বীজ বিনিময়ের Green Exchange ধারণা জানুন। নিরাপদ বিনিময়, স্থানীয় বাগানি ও গাছ ভাগাভাগির ব্যবহারিক নির্দেশনা।",
  alternates: { canonical: "/green-exchange" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: pageUrl,
    title: "Green Exchange | গাছ বিনিময় করুন – AGRIVA",
    description:
      "অতিরিক্ত চারা ভাগ করুন, নতুন গাছ খুঁজুন এবং স্থানীয় বাগানিদের সঙ্গে সবুজ সম্পর্ক গড়ুন।",
    siteName: "AGRIVA",
  },
  twitter: {
    card: "summary",
    title: "Green Exchange | গাছ বিনিময় – AGRIVA",
    description: "গাছ, চারা, কাটিং ও বীজ বিনিময় নিয়ে শখের বাগানিদের জন্য বাংলা গাইড।",
  },
};

const exchangeTypes = [
  {
    icon: "🪴",
    title: "গাছের বদলে গাছ",
    description: "আপনার অতিরিক্ত ইনডোর প্ল্যান্ট, ফুলের গাছ বা ফলের চারার বদলে অন্য গাছ নেওয়ার প্রস্তাব করুন।",
  },
  {
    icon: "🌱",
    title: "চারা ও কাটিং বিনিময়",
    description: "শিকড় গজানো কাটিং, সুস্থ চারা এবং পরিচিত প্রজাতির বীজের তথ্য দিয়ে বিনিময়ের পরিকল্পনা করুন।",
  },
  {
    icon: "🎁",
    title: "গাছ উপহার দিন",
    description: "বিনিময়ে কিছু না নিয়েও নতুন বাগানি বা স্থানীয় কমিউনিটির কাউকে গাছ দিতে পারেন।",
  },
  {
    icon: "🧤",
    title: "বাগানের উপকরণ ভাগাভাগি",
    description: "পরিষ্কার ও ব্যবহারযোগ্য টব, প্ল্যান্ট স্ট্যান্ড বা ছোট বাগানের সরঞ্জাম বিনিময়ের সুযোগ তৈরি করুন।",
  },
];

const steps = [
  ["১", "আপনার গাছের তথ্য প্রস্তুত করুন", "পরিষ্কার ছবি, গাছের নাম, সাইজ, অবস্থা, পরিমাণ এবং আনুমানিক এলাকা লিখুন।"],
  ["২", "কী পেতে চান তা জানান", "কোন গাছ বা উপকরণের সঙ্গে বিনিময় করতে চান, নাকি উপহার দিতে চান—সেটি স্পষ্ট করুন।"],
  ["৩", "দুই পক্ষের শর্তে সম্মত হন", "বিনিময়ের আগে গাছের অবস্থা, সংগ্রহের সময়, স্থান এবং পরিবহন খরচ পরিষ্কার করে নিন।"],
  ["৪", "নিরাপদে বিনিময় সম্পন্ন করুন", "সম্ভব হলে জনসমাগম আছে এমন জায়গায় দেখা করুন; অপরিচিত কাউকে ব্যক্তিগত ঠিকানা বা সংবেদনশীল তথ্য দেবেন না।"],
];

const faqs = [
  {
    question: "গাছ বিনিময় বলতে কী বোঝায়?",
    answer: "গাছ বিনিময় হলো দুই বাগানির পারস্পরিক সম্মতিতে গাছ, চারা, কাটিং বা বীজ একে অন্যকে দেওয়া। বিনিময়ের আগে কী দেওয়া হচ্ছে এবং কী পাওয়া যাবে তা স্পষ্ট করে নেওয়া উচিত।",
  },
  {
    question: "গাছের বদলে কি কাটিং বা চারা নেওয়া যায়?",
    answer: "হ্যাঁ, দুই পক্ষ সম্মত থাকলে সুস্থ চারা, উপযুক্ত কাটিং বা পরিচিত বীজ বিনিময়ের প্রস্তাব করা যায়। প্রজাতি, গাছের স্বাস্থ্য ও পরিবহনের উপযোগিতা আগে যাচাই করুন।",
  },
  {
    question: "বিনিময়ের সময় কী কী তথ্য দেওয়া উচিত?",
    answer: "গাছের সঠিক বা সম্ভাব্য নাম, সাম্প্রতিক ছবি, আকার, স্বাস্থ্য, পরিমাণ, সংগ্রহের এলাকা এবং কোনো বিশেষ যত্ন বা পরিবহন নির্দেশনা দিন।",
  },
  {
    question: "দূরে গাছ পাঠানো কি সবসময় নিরাপদ?",
    answer: "না। গাছের ধরন, আবহাওয়া, প্যাকেজিং ও যাত্রার সময়ের ওপর ঝুঁকি নির্ভর করে। স্থানীয়ভাবে বিনিময়কে অগ্রাধিকার দিন এবং প্রযোজ্য উদ্ভিদ-স্বাস্থ্য ও পরিবহন বিধি মেনে চলুন।",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Green Exchange | গাছ বিনিময় – AGRIVA",
  url: pageUrl,
  inLanguage: "bn-BD",
  description: metadata.description,
  isPartOf: { "@type": "WebSite", name: "AGRIVA", url: siteUrl },
};

export default function GreenExchangePage() {
  return (
    <main className="min-h-screen bg-[#f7faf6] text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/green-living" className="font-bold tracking-tight text-emerald-800">AGRIVA <span className="font-medium text-slate-500">Green Living</span></Link>
          <nav aria-label="Green Living navigation" className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/marketplace" className="hidden text-slate-600 hover:text-emerald-800 sm:inline">Plant Marketplace</Link>
            <Link href="/green-living" className="rounded-full border border-emerald-200 px-4 py-2 text-emerald-800 hover:bg-emerald-50">Green Living</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-medium text-emerald-50">শখের বাগানিদের জন্য • বাংলাদেশ</p>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">গাছ বিনিময় করুন, <span className="text-lime-200">সবুজ সম্পর্ক</span> গড়ে তুলুন</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50 sm:text-lg">আপনার বাড়তি চারা, কাটিং বা গাছ অন্য বাগানির সঙ্গে ভাগ করে নতুন গাছের সংগ্রহ গড়ুন। Green Exchange হলো গাছ ভাগাভাগি, স্থানীয়ভাবে বিনিময় এবং সচেতন বাগানচর্চার জন্য AGRIVA Green Living-এর একটি উদ্যোগ।</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-6 py-3 font-bold text-emerald-950 shadow-sm transition hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-900">বিনিময়ের নিয়ম জানুন</a>
              <Link href="/green-living" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">Green Living দেখুন</Link>
            </div>
            <p className="mt-4 text-sm text-emerald-100">এই পেজে এখন বিনিময়ের নিয়ম ও প্রস্তুতির গাইড দেওয়া হয়েছে। সরাসরি পোস্ট, অনুরোধ ও বিনিময় ট্র্যাকিং চালুর জন্য পরবর্তী অ্যাপ ইন্টিগ্রেশন প্রয়োজন।</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Green Exchange examples">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><span className="text-4xl" aria-hidden="true">🪴</span><h2 className="mt-3 font-bold">ইনডোর প্ল্যান্ট</h2><p className="mt-1 text-sm leading-6 text-emerald-100">ঘরের গাছ ও ছোট টব</p></div>
            <div className="mt-7 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><span className="text-4xl" aria-hidden="true">🌱</span><h2 className="mt-3 font-bold">চারা ও কাটিং</h2><p className="mt-1 text-sm leading-6 text-emerald-100">নতুন গাছের শুরু</p></div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><span className="text-4xl" aria-hidden="true">🌼</span><h2 className="mt-3 font-bold">ফুল ও ফলের গাছ</h2><p className="mt-1 text-sm leading-6 text-emerald-100">বাগানের বৈচিত্র্য</p></div>
            <div className="mt-7 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><span className="text-4xl" aria-hidden="true">🎁</span><h2 className="mt-3 font-bold">উপহার দিন</h2><p className="mt-1 text-sm leading-6 text-emerald-100">টাকা ছাড়াই ভাগাভাগি</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">What can you exchange?</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">কী কী বিনিময় করা যায়?</h2>
          <p className="mt-3 leading-7 text-slate-600">শুরু করার আগে গাছের অবস্থা, পরিমাণ ও বিনিময়ের শর্ত পরিষ্কার করুন। সব প্রস্তাবই দুই পক্ষের সম্মতির ভিত্তিতে হওয়া উচিত।</p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exchangeTypes.map((item) => <article key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="text-3xl" aria-hidden="true">{item.icon}</span><h3 className="mt-4 text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p></article>)}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-6 border-y border-emerald-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">How it works</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">নিরাপদ গাছ বিনিময়ের ৪ ধাপ</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([number, title, description]) => <article key={number} className="rounded-2xl bg-[#f7faf6] p-5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 font-bold text-white">{number}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-extrabold sm:text-3xl">গাছ বিনিময় নিয়ে সাধারণ প্রশ্ন</h2>
        <div className="mt-6 divide-y divide-emerald-100 rounded-2xl border border-emerald-100 bg-white px-5">
          {faqs.map((faq) => <details key={faq.question} className="group py-4"><summary className="cursor-pointer list-none pr-6 font-semibold leading-7 marker:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><span>{faq.question}</span><span aria-hidden="true" className="float-right text-emerald-700 group-open:rotate-45">+</span></summary><p className="mt-3 leading-7 text-slate-600">{faq.answer}</p></details>)}
        </div>
        <div className="mt-10 rounded-3xl bg-emerald-950 p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">আপনার বাগান থেকেই শুরু হোক ভাগাভাগি</h2>
          <p className="mt-3 max-w-2xl leading-7 text-emerald-100">আপনার গাছের যত্ন, ইনডোর প্ল্যান্ট ও ছাদবাগানের জন্য আরও বাংলা গাইড দেখুন।</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link href="/green-living" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950 hover:bg-lime-200">Green Living গাইড</Link><Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-5 py-3 font-semibold hover:bg-white/10">AGRIVA Marketplace</Link></div>
        </div>
      </section>

      <footer className="border-t border-emerald-100 bg-white px-4 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} AGRIVA · <Link href="/green-living" className="underline underline-offset-4 hover:text-emerald-800">Green Living</Link></footer>
    </main>
  );
}
