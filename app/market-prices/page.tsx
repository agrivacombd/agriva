import type { Metadata } from "next";

const sources = [
  { title: "কৃষি বিপণন অধিদপ্তর (DAM)", description: "সরকারি বাজারদর ও কৃষিপণ্যের মূল্যসংক্রান্ত তথ্য দেখুন।", href: "https://market.dam.gov.bd/", label: "সরকারি বাজারদর খুলুন" },
  { title: "কৃষি তথ্য সার্ভিস (AIS)", description: "ফসল উৎপাদন, বাজারজাতকরণ ও কৃষি সংক্রান্ত যাচাইকৃত তথ্য।", href: "https://ais.gov.bd/", label: "কৃষি তথ্য দেখুন" },
];

export const metadata: Metadata = {
  title: "বাংলাদেশের কৃষিপণ্যের বাজারদর | সরকারি মূল্যসূত্র | AGRIVA",
  description: "ধান, চাল, সবজি ও অন্যান্য কৃষিপণ্যের বাজারদর যাচাই করতে সরকারি কৃষি বিপণন অধিদপ্তরসহ নির্ভরযোগ্য উৎস দেখুন। বাজার, জেলা ও তারিখ অনুযায়ী দাম মিলিয়ে নিন।",
  alternates: { canonical: "/market-prices" },
  keywords: ["কৃষিপণ্যের বাজারদর", "বাংলাদেশ কৃষি বাজারদর", "ধানের দাম", "সবজির দাম", "কৃষি বিপণন অধিদপ্তর বাজারদর"],
  openGraph: { type: "website", locale: "bn_BD", siteName: "AGRIVA", title: "কৃষিপণ্যের বাজারদর যাচাই করুন | AGRIVA", description: "সরকারি উৎসে কৃষিপণ্যের বাজারদর যাচাই করার লিংক ও নির্দেশনা।", url: "/market-prices" },
};

export default function MarketPricesPage() {
  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-4xl">
      <a href="/tools" className="text-sm font-bold text-emerald-800 hover:underline">← কৃষি টুলবক্সে ফিরুন</a>
      <header className="mt-5 rounded-[2rem] bg-gradient-to-br from-emerald-950 to-teal-700 p-7 text-white sm:p-10">
        <p className="text-sm font-bold text-emerald-200">বাজার তথ্য</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">কৃষিপণ্যের বাজারদর</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50">ফসল বিক্রির আগে সরকারি উৎসে বাজারদর যাচাই করুন। দাম জেলা, বাজার, পণ্যের মান এবং তারিখ অনুযায়ী বদলাতে পারে।</p>
      </header>
      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-extrabold text-amber-950">দামের বিষয়ে গুরুত্বপূর্ণ কথা</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">এই পৃষ্ঠায় কোনো লাইভ দাম অনুমান করে দেখানো হচ্ছে না। নির্ভুল ও হালনাগাদ তথ্যের জন্য নিচের মূল সরকারি ওয়েবসাইট খুলুন এবং বাজার/তারিখ মিলিয়ে নিন।</p>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {sources.map((source) => <article key={source.href} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">{source.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{source.description}</p>
          <a href={source.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900">{source.label} ↗</a>
        </article>)}
      </section>
      <a href="/weather" className="mt-6 block rounded-2xl border border-emerald-100 bg-white p-5 font-bold text-emerald-900 hover:bg-emerald-50">আবহাওয়া দেখুন →</a>
      <p className="mt-8 text-center text-xs leading-5 text-slate-500">AGRIVA তথ্য সহায়ক। কেনাবেচার আগে স্থানীয় বাজারে দাম যাচাই করুন।</p>
    </div>
  </main>;
}
