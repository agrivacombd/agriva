import type { Metadata } from "next";
import Link from "next/link";
import SellerApplicationForm from "@/components/seller/SellerApplicationForm";

const siteUrl = "https://agriva.com.bd";
const pageUrl = `${siteUrl}/sell-on-plant-market`;

export const metadata: Metadata = {
  title: "Plant Market-এ গাছ ও চারা বিক্রি করুন | AGRIVA",
  description:
    "নার্সারি, গাছ ও চারার উৎপাদক, ইনডোর প্ল্যান্ট, ক্যাকটাস, সাকুলেন্ট এবং বাগান সামগ্রীর বিক্রেতারা AGRIVA Plant Market Seller হিসেবে আবেদন করুন।",
  alternates: { canonical: "/sell-on-plant-market" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
    url: pageUrl,
    title: "Plant Market-এ গাছ ও চারা বিক্রি করুন | AGRIVA",
    description:
      "আপনার নার্সারি ও গাছের ব্যবসা AGRIVA Plant Market-এ তুলে ধরুন। Seller আবেদন, যাচাই ও পণ্য প্রকাশের ধাপ জেনে নিন।",
  },
  twitter: {
    card: "summary",
    title: "Plant Market Seller হন | AGRIVA",
    description:
      "গাছ, চারা, ইনডোর প্ল্যান্ট ও বাগান সামগ্রীর বিক্রেতাদের জন্য AGRIVA Plant Market Seller আবেদন।",
  },
  robots: { index: true, follow: true },
};

const categories = [
  {
    number: "01",
    icon: "🌳",
    title: "ফল ও বনজ গাছের চারা",
    description: "আম, লিচু, পেয়ারা, লেবু, কাঠ ও অন্যান্য উপযুক্ত গাছের চারা।",
  },
  {
    number: "02",
    icon: "🌺",
    title: "ফুল ও শোভাবর্ধক গাছ",
    description: "ফুলের গাছ, পাতাবাহার, শোভাবর্ধক ও মৌসুমি গাছ।",
  },
  {
    number: "03",
    icon: "🪴",
    title: "ইনডোর প্ল্যান্ট",
    description: "ঘর, অফিস ও বারান্দার জন্য উপযোগী ইনডোর গাছ।",
  },
  {
    number: "04",
    icon: "🌵",
    title: "ক্যাকটাস ও সাকুলেন্ট",
    description: "ক্যাকটাস, সাকুলেন্ট ও ছোট আকারের সংগ্রহযোগ্য গাছ।",
  },
  {
    number: "05",
    icon: "🌱",
    title: "বীজ, কাটিং ও চারা",
    description: "গাছের বীজ, কাটিং, rooted cutting ও অন্যান্য planting material।",
  },
  {
    number: "06",
    icon: "🧤",
    title: "টব, মাটি ও বাগান সামগ্রী",
    description: "টব, planter, potting mix, growing media ও বাগানের প্রয়োজনীয় উপকরণ।",
  },
];

const steps = [
  {
    number: "১",
    title: "AGRIVA account-এ লগইন করুন",
    description: "আপনার বিদ্যমান অ্যাকাউন্ট ব্যবহার করুন অথবা নতুন account তৈরি করুন।",
  },
  {
    number: "২",
    title: "Plant Market Seller আবেদন জমা দিন",
    description: "আপনার পরিচয়, নার্সারি বা ব্যবসার তথ্য এবং প্রয়োজনীয় প্রমাণপত্র দিন।",
  },
  {
    number: "৩",
    title: "AGRIVA-এর যাচাই সম্পন্ন হতে দিন",
    description: "আমাদের টিম আবেদন পর্যালোচনা করবে। প্রয়োজন হলে অতিরিক্ত তথ্য চাইতে পারে।",
  },
  {
    number: "৪",
    title: "অনুমোদনের পর গাছ ও পণ্য যোগ করুন",
    description: "Plant Seller Dashboard থেকে পণ্যের ছবি, নাম, দাম, stock ও প্রয়োজনীয় বিবরণ দিয়ে listing জমা দিন।",
  },
];

const listingTips = [
  ["গাছের সঠিক নাম", "বাংলা বা পরিচিত নামের পাশাপাশি সম্ভব হলে variety বা species উল্লেখ করুন।"],
  ["বাস্তব ও পরিষ্কার ছবি", "গাছের বর্তমান অবস্থা, পাতা, ফুল বা ফল এবং চারার আকার বোঝা যায় এমন ছবি দিন।"],
  ["আকার ও বয়স", "প্রযোজ্য ক্ষেত্রে চারার উচ্চতা, বয়স, টবের size বা গাছের আনুমানিক মাপ লিখুন।"],
  ["দাম ও stock", "প্রতি গাছ/টব/প্যাকেটের মূল্য এবং বর্তমানে কতটি বিক্রির জন্য আছে তা জানান।"],
  ["যত্ন ও ডেলিভারি তথ্য", "রোদ, পানি, মাটি বা পরিচর্যার নির্দেশনা এবং delivery-সংক্রান্ত প্রয়োজনীয় তথ্য পরিষ্কার করুন।"],
];

const faqs = [
  {
    question: "কারা Plant Market Seller হিসেবে আবেদন করতে পারবেন?",
    answer:
      "নার্সারি, ফল-ফুলের চারা উৎপাদক, গাছের দোকান, ইনডোর প্ল্যান্ট ও ক্যাকটাস-সাকুলেন্ট বিক্রেতা এবং টব, মাটি ও বাগান সামগ্রী সরবরাহকারীরা আবেদন করতে পারবেন। প্রতিটি আবেদন যাচাই সাপেক্ষে বিবেচিত হবে।",
  },
  {
    question: "Plant Market Seller হতে কীভাবে আবেদন করব?",
    answer:
      "এই পেজের আবেদন অংশে গিয়ে AGRIVA account দিয়ে লগইন করুন এবং Plant Market Seller verification form পূরণ করে জমা দিন।",
  },
  {
    question: "আবেদন করলেই কি সঙ্গে সঙ্গে গাছ বিক্রি করতে পারব?",
    answer:
      "না। আবেদন জমা দেওয়ার পর AGRIVA টিম আপনার পরিচয় ও ব্যবসা/নার্সারির তথ্য যাচাই করবে। Plant Seller permission অনুমোদিত হলে আপনার Plant Seller Dashboard থেকে পণ্য যোগ করতে পারবেন। পণ্য review-এর পর প্রকাশিত হবে।",
  },
  {
    question: "Marketplace ও Plant Market-এ বিক্রির অনুমতি কি একই?",
    answer:
      "না। একই AGRIVA account ব্যবহার করা গেলেও Marketplace এবং Plant Market-এর seller permission আলাদা। দুই জায়গায় বিক্রি করতে চাইলে আলাদাভাবে আবেদন করতে হবে।",
  },
  {
    question: "গাছ বা চারার listing তৈরি করতে কী কী তথ্য লাগবে?",
    answer:
      "গাছের নাম, পরিষ্কার ছবি, দাম, stock এবং প্রযোজ্য ক্ষেত্রে গাছের উচ্চতা/বয়স, variety, টবের size, পরিচর্যার নির্দেশনা ও delivery-সংক্রান্ত তথ্য প্রস্তুত রাখুন। শুধু সঠিক ও যাচাইযোগ্য তথ্য দিন।",
  },
  {
    question: "আমার নার্সারি না থাকলেও কি আবেদন করতে পারব?",
    answer:
      "নার্সারি ছাড়াও গাছ, চারা বা বাগান সামগ্রী বিক্রির সঙ্গে যুক্ত ব্যক্তি ও ব্যবসা আবেদন করতে পারেন। আবেদন অনুমোদন নির্ভর করবে জমা দেওয়া পরিচয় ও ব্যবসার তথ্য যাচাইয়ের ওপর।",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Plant Market-এ গাছ ও চারা বিক্রি করুন | AGRIVA",
  url: pageUrl,
  description:
    "নার্সারি, গাছ ও চারার উৎপাদক এবং বাগান সামগ্রীর বিক্রেতাদের জন্য AGRIVA Plant Market Seller আবেদন ও onboarding তথ্য।",
  inLanguage: "bn-BD",
  isPartOf: { "@type": "WebSite", name: "AGRIVA", url: siteUrl },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Plant Market Seller", item: pageUrl },
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

export default function SellOnPlantMarketPage() {
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
            <Link href="/plant-market" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900 hover:underline">
              <span aria-hidden="true">←</span> AGRIVA Plant Market
            </Link>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/75 px-4 py-2 text-xs font-bold text-emerald-900 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              নার্সারি, গাছ ও বাগান সামগ্রীর বিক্রেতাদের জন্য
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.2] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              আপনার গাছ ও চারার
              <span className="block text-emerald-800">ব্যবসা পৌঁছে দিন</span>
              AGRIVA Plant Market-এ
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#526658] sm:text-lg">
              আপনার নার্সারিতে ফলের চারা, ফুলের গাছ, ইনডোর প্ল্যান্ট, ক্যাকটাস,
              সাকুলেন্ট কিংবা বাগানের উপকরণ আছে? Plant Market Seller হিসেবে
              আবেদন করুন। অনুমোদনের পর নিজের dashboard থেকে পণ্য যোগ করে
              ক্রেতাদের সামনে তুলে ধরুন।
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#seller-application" className="inline-flex min-h-13 items-center justify-center rounded-xl bg-[#145b3b] px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#104a30] focus:outline-none focus:ring-4 focus:ring-emerald-700/20">
                Plant Seller আবেদন শুরু করুন <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <Link href="/plant-market" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-emerald-950/15 bg-white/80 px-6 py-4 text-sm font-extrabold text-emerald-950 transition hover:bg-white">
                Plant Market ঘুরে দেখুন
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#526658]">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-700">✓</span> আলাদা Plant Seller verification</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-700">✓</span> নিজস্ব Plant Seller Dashboard</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-700">✓</span> Review-এর পর পণ্য প্রকাশ</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-emerald-900/5 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_28px_80px_rgba(24,65,39,.14)] backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">AGRIVA Plant Seller Centre</p>
                  <h2 className="mt-1 text-xl font-black">আপনার গাছের listing</h2>
                </div>
                <span className="rounded-xl bg-emerald-50 px-3 py-2 text-2xl" aria-hidden="true">🪴</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["🌿", "গাছের পরিচিতি", "নাম, variety ও category"],
                  ["📷", "বাস্তব ছবি", "গাছের বর্তমান অবস্থার ছবি"],
                  ["📏", "আকার ও বিবরণ", "উচ্চতা, বয়স ও টবের মাপ"],
                  ["৳", "দাম ও stock", "সঠিক মূল্য ও মজুত"],
                ].map(([icon, title, description]) => (
                  <div key={title} className="rounded-2xl bg-[#f1f6ed] p-4">
                    <span className="text-2xl" aria-hidden="true">{icon}</span>
                    <p className="mt-3 text-sm font-extrabold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#647468]">{description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-900/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold">আপনার seller journey</p>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">যাচাই প্রক্রিয়া</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-[#647468] sm:text-[11px]">
                  {["আবেদন", "যাচাই", "অনুমোদন", "পণ্য যোগ"].map((item, index) => (
                    <div key={item}><span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-900">{index + 1}</span>{item}</div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-[#718073]">
                এটি seller onboarding বোঝানোর একটি নমুনা; কোনো বাস্তব বিক্রির পরিসংখ্যান নয়।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>What you can sell</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Plant Market-এ কী কী বিক্রি করতে পারবেন?</h2>
          <p className="mt-4 text-base leading-7 text-[#647468]">
            ছোট ইনডোর গাছ থেকে শুরু করে ফলের চারা, নার্সারির গাছ এবং বাগানের প্রয়োজনীয় সামগ্রী—
            আপনার পণ্যের উপযুক্ত category বেছে listing জমা দিন।
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.number} className="group rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-[0_8px_30px_rgba(20,55,32,.04)] transition hover:-translate-y-1 hover:border-emerald-800/25 hover:shadow-lg">
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
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Plant Seller হওয়ার প্রক্রিয়া—৪টি সহজ ধাপ</h2>
            <p className="mt-5 text-base leading-8 text-[#5e7062]">
              প্রথমে seller আবেদন ও পরিচয় যাচাই, এরপর অনুমোদন। অনুমোদন পেলে
              dashboard থেকে গাছ ও পণ্যের listing জমা দিতে পারবেন। আবেদন করলেই
              seller permission বা product listing স্বয়ংক্রিয়ভাবে চালু হয় না।
            </p>
            <a href="#seller-application" className="mt-7 inline-flex items-center gap-2 font-extrabold text-emerald-900 hover:underline">
              আবেদন শুরু করুন <span aria-hidden="true">→</span>
            </a>
          </div>
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-4 rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#145b3b] text-lg font-black text-white">{step.number}</span>
                <div><h3 className="text-base font-extrabold">{step.title}</h3><p className="mt-1 text-sm leading-6 text-[#68796b]">{step.description}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <SectionEyebrow>Prepare your plant listing</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">পণ্য যোগ করার আগে এই তথ্যগুলো প্রস্তুত রাখুন</h2>
          <p className="mt-4 text-base leading-7 text-[#647468]">
            ক্রেতা যেন ছবি দেখে গাছটি চিনতে পারেন এবং size, দাম ও পরিচর্যা সম্পর্কে
            পরিষ্কার ধারণা পান—listing তৈরির সময় সেই তথ্যগুলো দিন।
          </p>
          <ul className="mt-7 space-y-4">
            {listingTips.map(([title, description]) => (
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
            {["গাছের নাম ও category সঠিক","ছবি বাস্তব এবং পরিষ্কার","আকার/বয়সের তথ্য প্রযোজ্য ক্ষেত্রে দেওয়া","দাম ও stock হালনাগাদ","পরিচর্যার তথ্য যাচাই করা","delivery-সংক্রান্ত তথ্য পরিষ্কার"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-[#f5f8f2] px-4 py-3 text-sm font-semibold text-[#405646]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-700" />{item}
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl border border-amber-900/10 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
            গাছের প্রজাতি, variety, বয়স বা পরিচর্যা সম্পর্কে নিশ্চিত না হলে অনুমান করে লিখবেন না।
            পণ্যের ছবি ও বিবরণ যেন বাস্তব গাছটির সঙ্গে মেলে।
          </p>
        </aside>
      </section>

      <section className="border-y border-emerald-950/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <SectionEyebrow>Frequently asked questions</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Plant Seller হওয়ার আগে আপনার প্রশ্ন</h2>
            <p className="mt-3 text-sm leading-7 text-[#68796b]">আবেদন, যাচাই এবং গাছের listing প্রকাশ সম্পর্কে জেনে নিন।</p>
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
            <SectionEyebrow>Start selling on Plant Market</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">আপনার গাছের ব্যবসা শুরু করুন AGRIVA-তে</h2>
            <p className="mt-5 text-base leading-8 text-[#5e7062]">
              Plant Market Seller permission-এর জন্য আবেদন করুন। আপনার তথ্য যাচাই
              করে অনুমোদন দেওয়া হলে Plant Seller Dashboard থেকে গাছ ও বাগান
              সামগ্রীর listing জমা দিতে পারবেন।
            </p>
            <div className="mt-7 rounded-2xl border border-emerald-950/10 bg-white/80 p-5">
              <h3 className="font-extrabold">আবেদনের আগে জেনে নিন</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5e7062]">
                <li>• Plant Market-এর জন্য আলাদা seller permission প্রয়োজন।</li>
                <li>• আবেদন যাচাই ও অনুমোদনের আগে পণ্য যোগ করা যাবে না।</li>
                <li>• জমা দেওয়া listing review-এর পর প্রকাশিত হবে।</li>
              </ul>
            </div>
            <p className="mt-5 text-sm text-[#647468]">
              কৃষি উপকরণ, বীজ, সার বা কৃষিযন্ত্র বিক্রি করতে চান?{" "}
              <Link href="/sell-on-marketplace" className="font-extrabold text-emerald-900 underline underline-offset-4">
                Marketplace Seller পেজ দেখুন
              </Link>
              ।
            </p>
          </div>
          <div>
            <SellerApplicationForm market="plant-market" />
          </div>
        </div>
      </section>

      <section className="bg-[#123f2b] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black">AGRIVA Plant Market</p>
            <p className="mt-1 text-sm text-emerald-100/80">গাছ, চারা ও বাগানপ্রেমীদের জন্য বাংলাদেশের অনলাইন Plant Market।</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-emerald-50">
            <Link href="/plant-market" className="hover:underline">Plant Market</Link>
            <Link href="/about-us" className="hover:underline">আমাদের সম্পর্কে</Link>
            <Link href="/contact-us" className="hover:underline">যোগাযোগ</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
