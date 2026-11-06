import type { Metadata } from "next";
import Link from "next/link";
import SellerApplicationForm from "@/components/seller/SellerApplicationForm";

const siteUrl = "https://agriva.com.bd";
const pageUrl = \`\${siteUrl}/sell-on-plant-market\`;

export const metadata: Metadata = {
  title: "Plant Market Seller হন | AGRIVA-তে গাছ ও চারা বিক্রি করুন",
  description:
    "নার্সারি, গাছের চারা, ইনডোর প্ল্যান্ট, ক্যাকটাস, সাকুলেন্ট ও বাগান সামগ্রীর ব্যবসা AGRIVA Plant Market-এ তুলে ধরুন। Seller হওয়ার ধাপ ও আবেদন জানুন।",
  alternates: { canonical: "/sell-on-plant-market" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
    url: pageUrl,
    title: "আপনার গাছের ব্যবসা নিয়ে আসুন AGRIVA Plant Market-এ",
    description:
      "Plant Market Seller আবেদন, যাচাই, অনুমোদন ও পণ্য তালিকাভুক্তির সহজ নির্দেশনা।",
  },
  twitter: {
    card: "summary",
    title: "Plant Market Seller হন | AGRIVA",
    description:
      "গাছ, চারা ও বাগান সামগ্রীর বিক্রেতাদের জন্য AGRIVA Plant Market Seller আবেদন।",
  },
  robots: { index: true, follow: true },
};

const categories = [
  { icon: "🌳", title: "ফল ও বনজ গাছের চারা", detail: "আম, লিচু, পেয়ারা, লেবু ও অন্যান্য চারা", tone: "bg-[#edf4e7]" },
  { icon: "🌺", title: "ফুল ও শোভাবর্ধক গাছ", detail: "ফুল, পাতাবাহার ও মৌসুমি গাছ", tone: "bg-[#f8efeb]" },
  { icon: "🪴", title: "ইনডোর প্ল্যান্ট", detail: "ঘর, অফিস ও বারান্দার গাছ", tone: "bg-[#edf2ec]" },
  { icon: "🌵", title: "ক্যাকটাস ও সাকুলেন্ট", detail: "ছোট ও সংগ্রহযোগ্য গাছ", tone: "bg-[#f5f1e7]" },
  { icon: "🌱", title: "বীজ, কাটিং ও চারা", detail: "বীজ, rooted cutting ও planting material", tone: "bg-[#edf4e7]" },
  { icon: "🧤", title: "টব ও বাগান সামগ্রী", detail: "টব, মাটি, potting mix ও প্রয়োজনীয় উপকরণ", tone: "bg-[#f3efea]" },
];

const steps = [
  { number: "01", title: "অ্যাকাউন্টে লগইন করুন", detail: "আপনার AGRIVA account ব্যবহার করুন অথবা নতুন account তৈরি করুন।", icon: "👤" },
  { number: "02", title: "Seller আবেদন জমা দিন", detail: "পরিচয় ও আপনার নার্সারি/ব্যবসার প্রয়োজনীয় তথ্য দিয়ে আবেদন সম্পন্ন করুন।", icon: "📝" },
  { number: "03", title: "যাচাই ও অনুমোদন", detail: "AGRIVA টিম আবেদন পর্যালোচনা করবে। প্রয়োজন হলে অতিরিক্ত তথ্য চাইতে পারে।", icon: "✓" },
  { number: "04", title: "পণ্য তালিকাভুক্ত করুন", detail: "অনুমোদনের পর Plant Seller Dashboard থেকে পণ্যের listing জমা দিন।", icon: "🪴" },
];

const preparation = [
  ["গাছের নাম ও variety", "পরিচিত নামের পাশাপাশি জানা থাকলে variety বা species লিখুন।"],
  ["নিজস্ব ও পরিষ্কার ছবি", "গাছের বর্তমান অবস্থা, পাতা, ফুল/ফল এবং আকার বোঝা যায় এমন ছবি দিন।"],
  ["আকার, বয়স ও টব", "প্রযোজ্য ক্ষেত্রে চারার উচ্চতা, বয়স এবং টবের মাপ উল্লেখ করুন।"],
  ["দাম ও stock", "প্রতি গাছ/টব/প্যাকেটের মূল্য এবং বিক্রির জন্য থাকা পরিমাণ দিন।"],
  ["পরিচর্যা ও delivery", "রোদ, পানি, মাটি এবং delivery-সংক্রান্ত প্রয়োজনীয় তথ্য পরিষ্কার করুন।"],
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
    question: "আবেদন করলেই কি সঙ্গে সঙ্গে পণ্য বিক্রি করতে পারব?",
    answer:
      "না। আবেদন জমা দেওয়ার পর AGRIVA টিম পরিচয় ও ব্যবসার তথ্য যাচাই করবে। Plant Seller permission অনুমোদিত হলে Dashboard থেকে পণ্য যোগ করতে পারবেন। জমা দেওয়া পণ্য review-এর পর প্রকাশিত হবে।",
  },
  {
    question: "Marketplace ও Plant Market-এর seller permission কি একই?",
    answer:
      "না। একই AGRIVA account ব্যবহার করা গেলেও Marketplace এবং Plant Market-এর seller permission আলাদা। দুই জায়গায় বিক্রি করতে চাইলে আলাদাভাবে আবেদন করতে হবে।",
  },
  {
    question: "আমার নার্সারি না থাকলেও কি আবেদন করতে পারব?",
    answer:
      "নার্সারি ছাড়াও গাছ, চারা বা বাগান সামগ্রী বিক্রির সঙ্গে যুক্ত ব্যক্তি ও ব্যবসা আবেদন করতে পারেন। অনুমোদন নির্ভর করবে জমা দেওয়া পরিচয় ও ব্যবসার তথ্য যাচাইয়ের ওপর।",
  },
  {
    question: "গাছের listing তৈরি করতে কী কী তথ্য লাগবে?",
    answer:
      "গাছের নাম, পরিষ্কার ছবি, দাম, stock এবং প্রযোজ্য ক্ষেত্রে উচ্চতা/বয়স, variety, টবের size, পরিচর্যার নির্দেশনা ও delivery-সংক্রান্ত তথ্য প্রস্তুত রাখুন। শুধু সঠিক ও যাচাইযোগ্য তথ্য দিন।",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Plant Market Seller হন | AGRIVA",
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47734e]">
      {children}
    </p>
  );
}

export default function SellOnPlantMarketPage() {
  return (
    <main className="overflow-hidden bg-[#fbfcf8] text-[#183a29]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      {/* Hero */}
      <section className="relative isolate border-b border-[#dce8d9] bg-[#eef5e9]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_10%,rgba(255,255,255,.95),transparent_38%),radial-gradient(ellipse_at_85%_80%,rgba(181,211,164,.48),transparent_42%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            <Link href="/plant-market" className="inline-flex items-center gap-2 text-sm font-bold text-[#376647] transition hover:text-[#173d2a]">
              <span aria-hidden="true">←</span> AGRIVA Plant Market
            </Link>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#cbdcc8] bg-white/80 px-4 py-2 text-xs font-bold text-[#376647] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#4e8a54]" />
              নার্সারি ও গাছের ব্যবসায়ীদের জন্য
            </div>
            <h1 className="mt-5 max-w-2xl text-[2.45rem] font-black leading-[1.16] tracking-tight sm:text-5xl lg:text-[3.65rem]">
              আপনার গাছের ব্যবসা
              <span className="mt-1 block text-[#397448]">পৌঁছে দিন আরও মানুষের কাছে</span>
              <span className="mt-1 block">AGRIVA Plant Market-এ</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#536b5b] sm:text-lg">
              ফলের চারা, ফুলের গাছ, ইনডোর প্ল্যান্ট কিংবা বাগানের সামগ্রী—আপনার
              পণ্য Plant Market-এ তুলে ধরতে Seller হিসেবে আবেদন করুন। যাচাই ও
              অনুমোদনের পর নিজের Dashboard থেকে listing জমা দিতে পারবেন।
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#seller-application"
                className="inline-flex min-h-14 items-center justify-center rounded-xl bg-[#1c633e] px-7 py-4 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(28,99,62,.22)] transition hover:-translate-y-0.5 hover:bg-[#164f32] focus:outline-none focus:ring-4 focus:ring-[#1c633e]/20"
              >
                Plant Seller আবেদন করুন <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <Link
                href="/plant-market"
                className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[#bfd2bc] bg-white/85 px-6 py-4 text-sm font-extrabold text-[#254c34] transition hover:bg-white"
              >
                Plant Market ঘুরে দেখুন
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#536b5b]">
              <span className="inline-flex items-center gap-2"><span className="text-[#3c804c]">✓</span> আলাদা Seller verification</span>
              <span className="inline-flex items-center gap-2"><span className="text-[#3c804c]">✓</span> নিজস্ব Plant Seller Dashboard</span>
              <span className="inline-flex items-center gap-2"><span className="text-[#3c804c]">✓</span> Review-এর পর listing প্রকাশ</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[590px]">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-[#9fbd94]/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-3 shadow-[0_28px_75px_rgba(28,66,39,.16)] sm:p-4">
              <div className="relative min-h-[280px] overflow-hidden rounded-[1.5rem] bg-[#dce9d5] sm:min-h-[340px]">
                <div
                  role="img"
                  aria-label="সবুজ গাছপালায় ভরা একটি নার্সারি"
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "linear-gradient(180deg,rgba(14,43,27,.02) 35%,rgba(14,43,27,.65) 100%),url('https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1400&q=85')" }}
                />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">Grow your plant business</p>
                  <h2 className="mt-2 max-w-sm text-2xl font-black leading-tight sm:text-3xl">আপনার নার্সারি, আপনার পরিচয়</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/85">গাছের সঠিক তথ্য ও বাস্তব ছবি দিয়ে তৈরি করুন আস্থার listing</p>
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-white/50 bg-white/90 px-3 py-2 text-xs font-extrabold text-[#27543a] shadow-sm">
                  🪴 Plant Seller Centre
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 pt-4 sm:gap-3 sm:p-3">
                <div className="rounded-xl bg-[#f0f5ed] p-3 text-center">
                  <span className="text-xl">🌿</span>
                  <p className="mt-1 text-xs font-extrabold text-[#315b3d]">গাছ ও চারা</p>
                </div>
                <div className="rounded-xl bg-[#f0f5ed] p-3 text-center">
                  <span className="text-xl">📷</span>
                  <p className="mt-1 text-xs font-extrabold text-[#315b3d]">বাস্তব ছবি</p>
                </div>
                <div className="rounded-xl bg-[#f0f5ed] p-3 text-center">
                  <span className="text-xl">🛒</span>
                  <p className="mt-1 text-xs font-extrabold text-[#315b3d]">পণ্য listing</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-2 hidden rounded-2xl border border-[#d9e6d5] bg-white px-4 py-3 shadow-lg sm:block">
              <p className="text-xs font-bold text-[#68806d]">আপনার পরবর্তী ধাপ</p>
              <p className="mt-1 text-sm font-black text-[#245338]">Seller আবেদন জমা দিন →</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Why Plant Market</Eyebrow>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">আপনার গাছের ব্যবসার জন্য একটি অনলাইন ঠিকানা</h2>
          <p className="mt-4 text-base leading-7 text-[#637568]">
            আপনার পণ্যের তথ্য এক জায়গায় সাজিয়ে উপস্থাপন করুন, আর আগ্রহী ক্রেতাদের
            জন্য গাছ বেছে নেওয়া সহজ করুন।
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-[#e0e9dc] bg-white p-6 shadow-[0_8px_28px_rgba(30,67,41,.04)]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf5e9] text-2xl">🌱</span>
            <h3 className="mt-4 text-lg font-extrabold">পণ্য সুন্দরভাবে উপস্থাপন</h3>
            <p className="mt-2 text-sm leading-6 text-[#66776a]">গাছের ছবি, নাম, আকার, দাম ও পরিচর্যার তথ্য দিয়ে পরিষ্কার listing তৈরি করুন।</p>
          </article>
          <article className="rounded-2xl border border-[#e0e9dc] bg-white p-6 shadow-[0_8px_28px_rgba(30,67,41,.04)]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7f0e8] text-2xl">🧑‍🌾</span>
            <h3 className="mt-4 text-lg font-extrabold">নিজের Seller Dashboard</h3>
            <p className="mt-2 text-sm leading-6 text-[#66776a]">অনুমোদনের পর Plant Seller Dashboard থেকে পণ্য listing জমা দিন।</p>
          </article>
          <article className="rounded-2xl border border-[#e0e9dc] bg-white p-6 shadow-[0_8px_28px_rgba(30,67,41,.04)] sm:col-span-2 lg:col-span-1">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf2ed] text-2xl">✓</span>
            <h3 className="mt-4 text-lg font-extrabold">যাচাইভিত্তিক প্রক্রিয়া</h3>
            <p className="mt-2 text-sm leading-6 text-[#66776a]">Seller আবেদন ও পণ্যের listing নির্ধারিত review প্রক্রিয়ার মধ্য দিয়ে যায়।</p>
          </article>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-[#e0e9dc] bg-[#f3f7f0]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>What you can sell</Eyebrow>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Plant Market-এ কী কী বিক্রি করতে পারবেন?</h2>
              <p className="mt-3 text-sm leading-7 text-[#637568]">আপনার পণ্যের ধরন অনুযায়ী উপযুক্ত category-তে listing জমা দিন।</p>
            </div>
            <Link href="/plant-market" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#2f6b43] hover:underline">
              পণ্যগুলো দেখুন <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <article key={category.title} className="group flex items-center gap-4 rounded-2xl border border-[#e0e9dc] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#b9d0b5] hover:shadow-md">
                <span className={\`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl \${category.tone}\`} aria-hidden="true">{category.icon}</span>
                <div>
                  <h3 className="font-extrabold text-[#244b32]">{category.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-[#718074]">{category.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Plant Seller হওয়ার প্রক্রিয়া</h2>
          <p className="mt-4 text-sm leading-7 text-[#637568]">আবেদন থেকে পণ্য listing—প্রতিটি ধাপ আগে থেকেই জেনে নিন।</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.number} className="relative rounded-2xl border border-[#e0e9dc] bg-white p-5 shadow-[0_8px_25px_rgba(30,67,41,.035)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-[0.18em] text-[#7c9a7d]">{step.number}</span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf5e9] text-xl">{step.icon}</span>
              </div>
              <h3 className="mt-5 text-base font-extrabold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#68796b]">{step.detail}</p>
              {index < steps.length - 1 && <span className="absolute -right-3 top-9 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[#dce8d9] bg-white text-sm text-[#69906b] lg:flex" aria-hidden="true">→</span>}
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-[#e8dfc8] bg-[#fbf8ef] p-4 text-sm leading-6 text-[#6b5a35] sm:px-5">
          <strong>মনে রাখুন:</strong> আবেদন জমা দিলেই seller permission বা পণ্য listing স্বয়ংক্রিয়ভাবে চালু হয় না। Seller অনুমোদনের পর listing জমা দিতে পারবেন; পণ্য review-এর পর প্রকাশিত হবে।
        </div>
      </section>

      {/* Listing readiness */}
      <section className="border-y border-[#e0e9dc] bg-[#f3f7f0]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-16">
          <div>
            <Eyebrow>Prepare your listing</Eyebrow>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight sm:text-4xl">ভালো listing-এর জন্য আগে থেকেই প্রস্তুত থাকুন</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#637568]">
              ক্রেতা যেন গাছটি চিনতে পারেন এবং size, দাম ও পরিচর্যা সম্পর্কে
              পরিষ্কার ধারণা পান—সেজন্য listing-এ নির্ভুল তথ্য দিন।
            </p>
            <ul className="mt-7 space-y-5">
              {preparation.map(([title, detail]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dcebd7] text-sm font-black text-[#326744]">✓</span>
                  <div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#68796b]">{detail}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <aside className="overflow-hidden rounded-[1.75rem] border border-[#dce8d9] bg-white shadow-[0_18px_55px_rgba(30,67,41,.07)]">
            <div className="bg-[#1e5a39] p-6 text-white sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c8e1c4]">Seller quick checklist</p>
              <h3 className="mt-2 text-2xl font-black">আবেদনের আগে প্রস্তুতি</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">ফর্ম পূরণের আগে প্রয়োজনীয় তথ্যগুলো হাতের কাছে রাখুন।</p>
            </div>
            <div className="space-y-3 p-6 sm:p-7">
              {["AGRIVA account-এ প্রবেশ করতে পারছেন","পরিচয় ও ব্যবসার তথ্য প্রস্তুত","নার্সারি/ব্যবসার পরিচিতি দিতে পারবেন","পণ্যের ছবি ও বিবরণ প্রস্তুত রাখবেন"].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-[#f4f7f1] px-4 py-3 text-sm font-semibold leading-6 text-[#405b46]">
                  <span className="mt-0.5 text-[#39804a]">✓</span>{item}
                </div>
              ))}
              <p className="rounded-xl border border-[#e8dfc8] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#6b5a35]">
                কোন তথ্য বা নথি প্রয়োজন হবে তা আবেদন ফর্মে দেওয়া নির্দেশনা অনুযায়ী পূরণ করুন। অনুমান করে বা ভুল তথ্য দেবেন না।
              </p>
              <a href="#seller-application" className="inline-flex w-full items-center justify-center rounded-xl bg-[#1c633e] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#164f32]">
                আবেদন অংশে যান <span className="ml-2">↓</span>
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 rounded-[2rem] bg-[#173f2b] p-7 text-white sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow>Clear and transparent process</Eyebrow>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">বিশ্বাস তৈরি হোক সঠিক তথ্য দিয়ে</h2>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Plant Market-এ ভালো অভিজ্ঞতার জন্য seller পরিচিতি ও পণ্যের তথ্য
              যাচাই করা হয়। তাই আবেদন এবং listing—দুই ক্ষেত্রেই বাস্তব ও নির্ভুল
              তথ্য দেওয়া জরুরি।
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
              <span className="text-2xl">🔎</span>
              <h3 className="mt-3 font-extrabold">Seller verification</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">পরিচয় ও ব্যবসার তথ্য পর্যালোচনা করা হয়।</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
              <span className="text-2xl">🪴</span>
              <h3 className="mt-3 font-extrabold">Product review</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">জমা দেওয়া পণ্যের তথ্য review-এর পর প্রকাশিত হয়।</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-[#e0e9dc] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="text-center">
            <Eyebrow>Frequently asked questions</Eyebrow>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">আপনার মনে যে প্রশ্নগুলো আসতে পারে</h2>
            <p className="mt-3 text-sm leading-7 text-[#68796b]">আবেদন, যাচাই ও পণ্য listing সম্পর্কে সাধারণ প্রশ্নের উত্তর।</p>
          </div>
          <div className="mt-8 divide-y divide-[#e6ede3] border-y border-[#e6ede3]">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="group py-5" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-extrabold marker:content-none">
                  <span>{faq.question}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf5e9] text-lg text-[#326744] transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="max-w-3xl pt-4 pr-10 text-sm leading-7 text-[#617265]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Application */}
      <section id="seller-application" className="scroll-mt-24 bg-[radial-gradient(ellipse_at_90%_0%,rgba(191,216,180,.5),transparent_38%),linear-gradient(135deg,#eaf3e5_0%,#f8faf6_55%,#e6f0e1_100%)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-9 lg:grid-cols-[.85fr_1.15fr]">
          <div className="lg:sticky lg:top-24">
            <Eyebrow>Start selling on Plant Market</Eyebrow>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">আপনার গাছের ব্যবসা নিয়ে আসুন AGRIVA-তে</h2>
            <p className="mt-5 text-sm leading-8 text-[#5e7062]">
              Plant Market Seller permission-এর জন্য আবেদন করুন। আপনার তথ্য
              যাচাই করে অনুমোদন দেওয়া হলে Plant Seller Dashboard থেকে গাছ ও
              বাগান সামগ্রীর listing জমা দিতে পারবেন।
            </p>
            <div className="mt-6 rounded-2xl border border-[#dce8d9] bg-white/85 p-5">
              <h3 className="font-extrabold">আবেদনের আগে জেনে নিন</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5e7062]">
                <li className="flex gap-2"><span className="text-[#39804a]">✓</span><span>Plant Market-এর জন্য আলাদা seller permission প্রয়োজন।</span></li>
                <li className="flex gap-2"><span className="text-[#39804a]">✓</span><span>আবেদন যাচাই ও অনুমোদনের আগে পণ্য যোগ করা যাবে না।</span></li>
                <li className="flex gap-2"><span className="text-[#39804a]">✓</span><span>জমা দেওয়া listing review-এর পর প্রকাশিত হবে।</span></li>
              </ul>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#647468]">
              কৃষি উপকরণ, বীজ, সার বা কৃষিযন্ত্র বিক্রি করতে চান?{" "}
              <Link href="/sell-on-marketplace" className="font-extrabold text-[#28623d] underline underline-offset-4">
                Marketplace Seller পেজ দেখুন
              </Link>
              ।
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white bg-white p-2 shadow-[0_20px_65px_rgba(30,67,41,.1)] sm:p-4">
            <SellerApplicationForm market="plant-market" />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#123f2b] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black">AGRIVA Plant Market</p>
            <p className="mt-1 text-sm text-emerald-100/80">গাছ, চারা ও বাগানপ্রেমীদের জন্য অনলাইন Plant Market।</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-emerald-50">
            <Link href="/plant-market" className="hover:underline">Plant Market</Link>
            <Link href="/about-us" className="hover:underline">আমাদের সম্পর্কে</Link>
            <Link href="/contact-us" className="hover:underline">যোগাযোগ</Link>
          </div>
        </div>
      </section>

      {/* Mobile application shortcut */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dce8d9] bg-white/95 p-3 shadow-[0_-8px_24px_rgba(20,55,32,.1)] backdrop-blur md:hidden">
        <a href="#seller-application" className="flex min-h-12 items-center justify-center rounded-xl bg-[#1c633e] px-5 py-3 text-sm font-extrabold text-white">
          Plant Seller আবেদন করুন <span className="ml-2" aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  );
}
