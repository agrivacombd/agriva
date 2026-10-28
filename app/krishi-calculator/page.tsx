import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "কৃষি ক্যালকুলেটর: সার, বীজ ও চাষের লাভ-লোকসানের হিসাব | AGRIVA",
  description: "জমির পরিমাণ অনুযায়ী সার ও বীজের হিসাব, চাষের খরচ, সম্ভাব্য আয়-লাভ এবং ফসল পরিকল্পনার সহজ বাংলা কৃষি ক্যালকুলেটর ব্যবহার করুন।",
  alternates: { canonical: "/krishi-calculator" },
  openGraph: {
    title: "বাংলা কৃষি ক্যালকুলেটর | AGRIVA",
    description: "সার, বীজ, চাষের খরচ ও ফসলের লাভ-লোকসানের হিসাব করুন নিজের দেওয়া তথ্য দিয়ে।",
    url: "/krishi-calculator",
    type: "website",
    locale: "bn_BD",
  },
  keywords: ["কৃষি ক্যালকুলেটর", "বাংলা কৃষি হিসাব", "সার হিসাব", "বীজের পরিমাণ", "চাষের খরচ", "ফসলের লাভ লোকসান"],
};

const tools = [
  { href: "/fertilizer-calculator", title: "সার হিসাব ক্যালকুলেটর", description: "জমির আয়তন ও আপনার নির্ধারিত সারের হার থেকে মোট প্রয়োজনীয় সার হিসাব করুন।" },
  { href: "/seed-rate-calculator", title: "বীজের পরিমাণ হিসাব", description: "একর, হেক্টর বা শতক অনুযায়ী বীজের প্রয়োজনীয় পরিমাণ বের করুন।" },
  { href: "/farming-cost-profit-calculator", title: "চাষের খরচ ও লাভ-লোকসান", description: "উৎপাদন খরচ, ফলন ও বিক্রয়মূল্য দিয়ে সম্ভাব্য আয় এবং লাভ-লোকসান তুলনা করুন।" },
  { href: "/soil-fertilizer", title: "মাটি ও সার পরিকল্পনা", description: "মাটি পরীক্ষা বা স্থানীয় কৃষি নির্দেশনায় পাওয়া পুষ্টি উপাদানের হার দিয়ে হিসাব করুন।" },
  { href: "/crop-choice", title: "ফসল বাছাই ও লাভ তুলনা", description: "নিজের খরচ, ফলন ও বাজারদর ধরে বিভিন্ন ফসলের সম্ভাব্য লাভ তুলনা করুন।" },
  { href: "/crop-calendar", title: "ফসল ক্যালেন্ডার", description: "মৌসুমের কৃষিকাজের ধাপ ও করণীয় চেকলিস্ট গুছিয়ে রাখুন।" },
];

export default function KrishiCalculatorPage() {
  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white sm:p-10 lg:p-12">
          <p className="text-sm font-bold text-emerald-200">AGRIVA · বাংলা কৃষি সহায়ক টুল</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">সহজ বাংলা কৃষি ক্যালকুলেটর: সার, বীজ, খরচ ও লাভের হিসাব</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">জমির পরিমাণ, উপকরণের খরচ, সম্ভাব্য ফলন এবং বিক্রয়মূল্য দিয়ে প্রয়োজনীয় হিসাব নিজেই করুন। কৃষক, কৃষি শিক্ষার্থী ও কৃষি উদ্যোক্তাদের দৈনন্দিন পরিকল্পনায় সহায়তার জন্য এই টুলগুলো সাজানো হয়েছে।</p>
          <Link href="/agriculture-calculators" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-emerald-950 hover:bg-emerald-50">সব কৃষি ক্যালকুলেটর দেখুন →</Link>
        </header>
        <section className="mt-8" aria-labelledby="krishi-tools-heading">
          <h2 id="krishi-tools-heading" className="text-2xl font-black sm:text-3xl">আপনার প্রয়োজনের হিসাব বেছে নিন</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-6">
                <h3 className="text-lg font-extrabold sm:text-xl">{tool.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{tool.description}</p>
                <span className="mt-4 inline-block font-bold text-emerald-800">হিসাব শুরু করুন →</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-8">
          <h2 className="text-xl font-black">হিসাব ব্যবহারের আগে মনে রাখুন</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">সার ও বীজের সঠিক হার ফসল, জাত, মাটি, আবহাওয়া এবং চাষপদ্ধতির ওপর নির্ভর করে। সম্ভব হলে মাটি পরীক্ষার ফল এবং স্থানীয় কৃষি কর্মকর্তার পরামর্শ ব্যবহার করুন। লাভের হিসাবের সময় শ্রম, সেচ, জমির ভাড়া, পরিবহন, সংরক্ষণ ও সম্ভাব্য ক্ষতির খরচও ধরুন। এই ক্যালকুলেটরগুলোর ফল আপনার দেওয়া তথ্যের ভিত্তিতে আনুমানিক হিসাব, নিশ্চিত ফলনের প্রতিশ্রুতি নয়।</p>
        </section>
      </div>
    </main>
  );
}
