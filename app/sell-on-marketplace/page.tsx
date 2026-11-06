import type { Metadata } from "next";
import Link from "next/link";
import SellerApplicationForm from "@/components/seller/SellerApplicationForm";

const siteUrl = "https://agriva.com.bd";
const pageUrl = `${siteUrl}/sell-on-marketplace`;

export const metadata: Metadata = {
  title: "কৃষিপণ্য অনলাইনে বিক্রি করুন | AGRIVA Marketplace",
  description:
    "বাংলাদেশে বীজ, সার, কৃষি উপকরণ, ফসল সুরক্ষা পণ্য ও কৃষিযন্ত্র বিক্রির জন্য AGRIVA Marketplace Seller হিসেবে আবেদন করুন। ব্যবসার তথ্য যাচাই করে পণ্য তালিকাভুক্তির সুযোগ নিন।",
  alternates: { canonical: "/sell-on-marketplace" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
    url: pageUrl,
    title: "কৃষিপণ্য অনলাইনে বিক্রি করুন | AGRIVA Marketplace",
    description:
      "আপনার কৃষি ব্যবসার পণ্য AGRIVA Marketplace-এ উপস্থাপন করতে Seller হিসেবে আবেদন করুন।",
  },
  twitter: {
    card: "summary",
    title: "কৃষিপণ্য অনলাইনে বিক্রি করুন | AGRIVA Marketplace",
    description:
      "বীজ, সার, কৃষি উপকরণ ও কৃষিযন্ত্রের ব্যবসায়ীদের জন্য AGRIVA Marketplace Seller আবেদন।",
  },
  robots: { index: true, follow: true },
};

const categories = [
  {
    number: "01",
    title: "বীজ ও চারা উৎপাদনের উপকরণ",
    description: "ফসল, সবজি ও অন্যান্য অনুমোদিত বীজের পণ্য।",
    icon: "🌱",
  },
  {
    number: "02",
    title: "সার ও মাটির পুষ্টি উপকরণ",
    description: "সার, মাটি উন্নয়ন ও উদ্ভিদ পুষ্টি-সম্পর্কিত পণ্য।",
    icon: "🪴",
  },
  {
    number: "03",
    title: "ফসল সুরক্ষা পণ্য",
    description: "প্রযোজ্য নিয়ম মেনে অনুমোদিত ফসল সুরক্ষা পণ্য।",
    icon: "🛡️",
  },
  {
    number: "04",
    title: "কৃষি যন্ত্রপাতি ও সরঞ্জাম",
    description: "কৃষিকাজে ব্যবহৃত যন্ত্র, যন্ত্রাংশ ও সরঞ্জাম।",
    icon: "⚙️",
  },
  {
    number: "05",
    title: "খাদ্যশস্য ও কৃষিপণ্য",
    description: "অনুমোদিত শস্য, ডাল, তেলবীজ ও প্যাকেটজাত কৃষিপণ্য।",
    icon: "🌾",
  },
  {
    number: "06",
    title: "অন্যান্য কৃষি উপকরণ",
    description: "Marketplace-এর নীতিমালার আওতাভুক্ত অন্যান্য পণ্য।",
    icon: "📦",
  },
];

const steps = [
  {
    number: "১",
    title: "AGRIVA account-এ লগইন করুন",
    description: "আপনার বিদ্যমান অ্যাকাউন্ট ব্যবহার করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।",
  },
  {
    number: "২",
    title: "Marketplace Seller verification-এর আবেদন করুন",
    description: "ব্যবসা বা প্রতিষ্ঠানের পরিচয় ও প্রয়োজনীয় তথ্য জমা দিন।",
  },
  {
    number: "৩",
    title: "অনুমোদনের জন্য অপেক্ষা করুন",
    description: "AGRIVA টিম আপনার আবেদন পর্যালোচনা করবে। Marketplace permission আলাদাভাবে যাচাই করা হয়।",
  },
  {
    number: "৪",
    title: "অনুমোদনের পর পণ্য যোগ করুন",
    description: "পণ্যের নাম, category, ছবি, বিবরণ, মূল্য ও stock দিয়ে listing জমা দিন।",
  },
];

const faqs = [
  {
    question: "কারা AGRIVA Marketplace Seller হিসেবে আবেদন করতে পারবেন?",
    answer:
      "কৃষি উপকরণ, বীজ, সার, ফসল সুরক্ষা পণ্য, কৃষিযন্ত্র, খাদ্যশস্য ও অনুমোদিত কৃষিপণ্যের ব্যবসা বা সরবরাহের সঙ্গে যুক্ত ব্যক্তি ও প্রতিষ্ঠান আবেদন করতে পারবেন। প্রতিটি আবেদন যাচাই সাপেক্ষে বিবেচিত হবে।",
  },
  {
    question: "Seller হতে কীভাবে আবেদন করব?",
    answer:
      "এই পেজের Seller আবেদন অংশ থেকে Marketplace Seller verification শুরু করুন। প্রয়োজন হলে প্রথমে AGRIVA account-এ লগইন বা account তৈরি করতে হবে।",
  },
  {
    question: "আবেদন করলেই কি পণ্য বিক্রি বা প্রকাশ করা যাবে?",
    answer:
      "না। আবেদন জমা দেওয়ার পর পরিচয় ও ব্যবসার তথ্য যাচাই করা হয়। Marketplace permission অনুমোদিত হলে Seller Centre থেকে পণ্য জমা দিতে পারবেন। জমা দেওয়া পণ্য অ্যাডমিন পর্যালোচনা ও অনুমোদনের পর Marketplace-এ প্রকাশিত হবে।",
  },
  {
    question: "একটি AGRIVA account দিয়ে কি Marketplace ও Plant Market—দুই জায়গাতেই বিক্রি করা যাবে?",
    answer:
      "একই AGRIVA account ব্যবহার করা যায়, তবে Marketplace এবং Plant Market-এর seller permission আলাদা। Plant Market-এ বিক্রির জন্য আলাদা আবেদন ও অনুমোদন প্রয়োজন।",
  },
  {
    question: "পণ্য যোগ করার আগে কী কী তথ্য প্রস্তুত রাখব?",
    answer:
      "পণ্যের সঠিক নাম, category, পরিষ্কার ছবি, একক, মূল্য, stock, ব্র্যান্ড বা উৎপত্তিস্থল (প্রযোজ্য হলে) এবং যাচাইযোগ্য specification ও ব্যবহারবিধি প্রস্তুত রাখুন। অজানা তথ্য অনুমান করে দেবেন না।",
  },
  {
    question: "পণ্য জমা দেওয়ার পর কি তথ্য পরিবর্তন করা যাবে?",
    answer:
      "পণ্য ব্যবস্থাপনার জন্য Seller Centre-এর উপলভ্য edit সুবিধা ব্যবহার করুন। কোনো listing সম্পাদনার সুযোগ না থাকলে সহায়তার জন্য AGRIVA-র Contact পেজে যোগাযোগ করুন।",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "কৃষিপণ্য অনলাইনে বিক্রি করুন | AGRIVA Marketplace",
  url: pageUrl,
  description:
    "বাংলাদেশের কৃষি ব্যবসায়ী ও প্রতিষ্ঠানের জন্য AGRIVA Marketplace Seller আবেদন ও onboarding তথ্য।",
  inLanguage: "bn-BD",
  isPartOf: {
    "@type": "WebSite",
    name: "AGRIVA",
    url: siteUrl,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Marketplace Seller",
        item: pageUrl,
      },
    ],
  },
};

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-800">
      {children}
    </p>
  );
}

export default function SellOnMarketplacePage() {
  return (
    <main className="overflow-hidden bg-[#f7f9f5] text-[#17351f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <section className="relative isolate border-b border-emerald-950/10 bg-[radial-gradient(ellipse_at_85%_15%,rgba(194,218,163,.58),transparent_42%),linear-gradient(120deg,#f7faf3_0%,#edf5e8_58%,#e4f0df_100%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900 hover:underline"
            >
              <span aria-hidden="true">←</span> AGRIVA Marketplace
            </Link>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/75 px-4 py-2 text-xs font-bold text-emerald-900 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              কৃষি ব্যবসা ও প্রতিষ্ঠানের জন্য Seller Centre
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.2] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              আপনার কৃষিপণ্য
              <span className="block text-emerald-800">অনলাইনে উপস্থাপন করুন</span>
              AGRIVA Marketplace-এ
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#526658] sm:text-lg">
              বীজ, সার, কৃষি উপকরণ, ফসল সুরক্ষা পণ্য ও কৃষিযন্ত্রের ব্যবসা করেন?
              AGRIVA Marketplace Seller হিসেবে আবেদন করুন এবং অনুমোদনের পর
              আপনার পণ্যের তথ্য অনলাইনে তালিকাভুক্ত করুন।
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#seller-application"
                className="inline-flex min-h-13 items-center justify-center rounded-xl bg-[#145b3b] px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#104a30] focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
              >
                Seller আবেদন শুরু করুন <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <Link
                href="/marketplace"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-emerald-950/15 bg-white/80 px-6 py-4 text-sm font-extrabold text-emerald-950 transition hover:bg-white"
              >
                Marketplace ঘুরে দেখুন
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#526658]">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-700">✓</span> আলাদা Seller verification</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-700">✓</span> পণ্য জমার আগে নির্দেশনা</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-700">✓</span> Admin review-এর পর প্রকাশ</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-emerald-900/5 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_28px_80px_rgba(24,65,39,.14)] backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">AGRIVA Seller Centre</p>
                  <h2 className="mt-1 text-xl font-black">আপনার পণ্যের পরিচিতি</h2>
                </div>
                <span className="rounded-xl bg-emerald-50 px-3 py-2 text-2xl" aria-hidden="true">🌾</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f1f6ed] p-4">
                  <span className="text-2xl" aria-hidden="true">🌱</span>
                  <p className="mt-3 text-sm font-extrabold">পণ্যের category</p>
                  <p className="mt-1 text-xs leading-5 text-[#647468]">সঠিক বিভাগ ও উপবিভাগ</p>
                </div>
                <div className="rounded-2xl bg-[#f1f6ed] p-4">
                  <span className="text-2xl" aria-hidden="true">📷</span>
                  <p className="mt-3 text-sm font-extrabold">পণ্যের ছবি</p>
                  <p className="mt-1 text-xs leading-5 text-[#647468]">পরিষ্কার ও বাস্তব ছবি</p>
                </div>
                <div className="rounded-2xl bg-[#f1f6ed] p-4">
                  <span className="text-2xl" aria-hidden="true">৳</span>
                  <p className="mt-3 text-sm font-extrabold">মূল্য ও stock</p>
                  <p className="mt-1 text-xs leading-5 text-[#647468]">একক অনুযায়ী সঠিক তথ্য</p>
                </div>
                <div className="rounded-2xl bg-[#f1f6ed] p-4">
                  <span className="text-2xl" aria-hidden="true">✍️</span>
                  <p className="mt-3 text-sm font-extrabold">বিস্তারিত বিবরণ</p>
                  <p className="mt-1 text-xs leading-5 text-[#647468]">যাচাইযোগ্য specification</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-900/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold">Listing review process</p>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">পর্যালোচনাধীন</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-[#647468]">
                  <div><span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-900">1</span>তথ্য জমা</div>
                  <div><span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-900">2</span>যাচাই</div>
                  <div><span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-900">3</span>প্রকাশ</div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-[#718073]">
                এটি Seller onboarding বোঝানোর একটি illustrative preview; কোনো বাস্তব বিক্রির পরিসংখ্যান নয়।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Who can sell</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            কোন ধরনের কৃষি ব্যবসার পণ্য তালিকাভুক্ত করতে পারবেন?
          </h2>
          <p className="mt-4 text-base leading-7 text-[#647468]">
            আপনার পণ্যটি Marketplace-এর উপযুক্ত category-তে জমা দিন। সব listing
            প্রযোজ্য নীতিমালা ও প্রশাসনিক পর্যালোচনা সাপেক্ষে অনুমোদিত হবে।
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.number}
              className="group rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-[0_8px_30px_rgba(20,55,32,.04)] transition hover:-translate-y-1 hover:border-emerald-800/25 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eff6eb] text-2xl" aria-hidden="true">{category.icon}</span>
                <span className="text-xs font-black tracking-widest text-emerald-800/45">{category.number}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold">{category.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#68796b]">{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-emerald-950/10 bg-[#edf4e9]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-20">
          <div>
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Seller হওয়ার প্রক্রিয়া—ধাপে ধাপে
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5e7062]">
              আবেদন, verification এবং product review—প্রতিটি ধাপ সম্পন্ন হলে
              পরবর্তী কাজের সুযোগ পাবেন। আবেদন করলেই listing স্বয়ংক্রিয়ভাবে
              প্রকাশিত হয় না।
            </p>
            <a href="#seller-application" className="mt-7 inline-flex items-center gap-2 font-extrabold text-emerald-900 hover:underline">
              এখনই আবেদন করুন <span aria-hidden="true">→</span>
            </a>
          </div>
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-4 rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#145b3b] text-lg font-black text-white">{step.number}</span>
                <div>
                  <h3 className="text-base font-extrabold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#68796b]">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <SectionEyebrow>Prepare your listing</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            ভালো product listing-এর জন্য আগে থেকেই প্রস্তুত থাকুন
          </h2>
          <p className="mt-4 text-base leading-7 text-[#647468]">
            পণ্যের তথ্য যত নির্ভুল ও পরিষ্কার হবে, ক্রেতার জন্য সেটি বোঝা তত সহজ
            হবে। কেবল বাস্তব ও যাচাইযোগ্য তথ্য ব্যবহার করুন।
          </p>
          <ul className="mt-7 space-y-4">
            {[
              ["সঠিক নাম ও category", "পণ্যের পরিচিত নাম এবং সবচেয়ে উপযুক্ত বিভাগ নির্বাচন করুন।"],
              ["বাস্তব পণ্যের ছবি", "পরিষ্কার, আলোযুক্ত এবং পণ্যের সঙ্গে মেলে এমন ছবি দিন।"],
              ["মূল্য, একক ও stock", "প্রতি এককের মূল্য এবং মজুতের পরিমাণ সঠিকভাবে উল্লেখ করুন।"],
              ["Specification ও ব্যবহার", "ব্র্যান্ড, পরিমাণ, উপাদান বা ব্যবহারবিধি—যা প্রযোজ্য এবং নিশ্চিত, তাই লিখুন।"],
            ].map(([title, description]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-900">✓</span>
                <div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#68796b]">{description}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <aside className="rounded-[2rem] border border-emerald-950/10 bg-white p-6 shadow-[0_18px_60px_rgba(20,55,32,.07)] sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eff6eb] text-2xl" aria-hidden="true">📋</span>
            <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Seller checklist</p><h3 className="text-xl font-black">পণ্য জমা দেওয়ার আগে</h3></div>
          </div>
          <div className="mt-6 space-y-3">
            {["পণ্যের নাম ও category ঠিক আছে","ছবি পণ্যের সঙ্গে মিলে","মূল্য ও একক নির্ভুল","stock-এর পরিমাণ হালনাগাদ","বিবরণে অপ্রমাণিত দাবি নেই","প্রযোজ্য specification যাচাই করা"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-[#f5f8f2] px-4 py-3 text-sm font-semibold text-[#405646]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-700" />{item}
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl border border-amber-900/10 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
            বীজ, সার ও ফসল সুরক্ষা পণ্যের ক্ষেত্রে প্রযোজ্য নিবন্ধন, লেবেল,
            নিরাপত্তা ও আইনগত শর্ত মেনে চলুন। কোনো তথ্য নিশ্চিত না হলে সেটি
            ফাঁকা রাখুন।
          </p>
        </aside>
      </section>

      <section className="border-y border-emerald-950/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <SectionEyebrow>Frequently asked questions</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Seller হওয়ার আগে আপনার প্রশ্ন
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#68796b]">
              আবেদন, verification এবং পণ্য প্রকাশের প্রক্রিয়া সম্পর্কে জেনে নিন।
            </p>
          </div>
          <div className="mt-9 divide-y divide-emerald-950/10 border-y border-emerald-950/10">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="group py-5" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-extrabold marker:content-none">
                  <span>{faq.question}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eff6eb] text-lg text-emerald-900 transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="max-w-3xl pt-4 pr-10 text-sm leading-7 text-[#617265]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="seller-application" className="scroll-mt-24 bg-[linear-gradient(135deg,#eaf3e5_0%,#f8faf6_52%,#e4f0df_100%)] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="lg:sticky lg:top-24">
            <SectionEyebrow>Start selling on AGRIVA</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              আপনার কৃষি ব্যবসার জন্য Seller আবেদন শুরু করুন
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5e7062]">
              Marketplace Seller permission-এর জন্য আবেদন করুন। আপনার আবেদন
              যাচাইয়ের পর অনুমোদিত হলে পণ্য যোগ করার সুবিধা পাবেন।
            </p>
            <div className="mt-7 rounded-2xl border border-emerald-950/10 bg-white/80 p-5">
              <h3 className="font-extrabold">মনে রাখুন</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5e7062]">
                <li>• Marketplace ও Plant Market-এর অনুমোদন আলাদা।</li>
                <li>• আবেদন যাচাই না হওয়া পর্যন্ত পণ্য যোগ করা যাবে না।</li>
                <li>• জমা দেওয়া পণ্য অনুমোদনের আগে প্রকাশিত হবে না।</li>
              </ul>
            </div>
            <p className="mt-5 text-sm text-[#647468]">
              Plant Market-এ গাছ, চারা বা নার্সারি পণ্য বিক্রি করতে চান?{" "}
              <Link href="/sell-on-plant-market" className="font-extrabold text-emerald-900 underline underline-offset-4">
                Plant Market Seller পেজ দেখুন
              </Link>
              ।
            </p>
          </div>
          <div>
            <SellerApplicationForm market="marketplace" />
          </div>
        </div>
      </section>

      <section className="bg-[#123f2b] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black">AGRIVA Marketplace</p>
            <p className="mt-1 text-sm text-emerald-100/80">বাংলাদেশের কৃষি ব্যবসার পণ্য আবিষ্কার ও উপস্থাপনের ডিজিটাল প্ল্যাটফর্ম।</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-emerald-50">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link>
            <Link href="/about-us" className="hover:underline">আমাদের সম্পর্কে</Link>
            <Link href="/contact-us" className="hover:underline">যোগাযোগ</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
