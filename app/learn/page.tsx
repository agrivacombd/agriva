import type { Metadata } from "next";
import Link from "next/link";
import { LESSONS } from "@/lib/learn/lessons";

export const metadata: Metadata = {
  title: "কৃষি শেখার কেন্দ্র: ধান, সবজি, মাটি ও রোগবালাই",
  description: "বাংলাদেশি কৃষকদের জন্য সহজ বাংলায় ধাপে ধাপে কৃষি গাইড, ব্যবহারিক পরামর্শ ও কুইজ।",
  alternates: { canonical: "/learn" },
  openGraph: { title: "কৃষি শেখার কেন্দ্র | AGRIVA", description: "ফসল চাষ, মাটির স্বাস্থ্য ও সমন্বিত বালাই ব্যবস্থাপনা শিখুন।", url: "/learn", type: "website" },
};

export default function LearnPage() {
  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl">
    <Link href="/tools" className="text-sm font-bold text-emerald-800 hover:underline">← কৃষি টুলবক্স</Link>
    <header className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">AGRIVA · শিখুন ও প্রয়োগ করুন</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">কৃষি শেখার কেন্দ্র</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">সহজ বাংলায় ধাপে ধাপে কৃষি গাইড পড়ুন, গুরুত্বপূর্ণ বিষয় মনে রাখুন এবং ছোট কুইজ দিয়ে নিজের জ্ঞান যাচাই করুন।</p></header>
    <div className="mt-8 flex flex-wrap gap-2">{["ধান", "সবজি", "মাটির স্বাস্থ্য", "রোগবালাই"].map((tag) => <span key={tag} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900">{tag}</span>)}</div>
    <section className="mt-8 grid gap-5 sm:grid-cols-2">
      {LESSONS.map((lesson, i) => <article key={lesson.slug} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl">{["🌾", "🥬", "🌱", "🐛"][i]}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{lesson.duration}</span></div><p className="mt-5 text-xs font-bold text-emerald-800">{lesson.crop}</p><h2 className="mt-1 text-xl font-black">{lesson.title}</h2><p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{lesson.summary}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{lesson.steps.length}টি ধাপ · ১টি কুইজ</span><Link href={`/learn/${lesson.slug}`} className="text-sm font-extrabold text-emerald-800 hover:underline">গাইড পড়ুন →</Link></div></article>)}
    </section>
    <section className="mt-8">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">কৃষিবিদদের জন্য বিশেষ টুল</p><h2 className="mt-2 text-2xl font-black text-emerald-950">Plant Science Academy</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">বৈজ্ঞানিক নাম রিভিশন, উদ্ভিদ শনাক্তকরণ-ভিত্তিক অনুশীলন এবং রোগের লক্ষণ পর্যবেক্ষণের শিক্ষামূলক কেস। লক্ষণভিত্তিক ফল নিশ্চিত রোগ নির্ণয় নয়।</p></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/learn/plant-science" className="rounded-2xl border border-emerald-200 bg-white p-5 transition hover:border-emerald-500 hover:shadow-sm"><span className="text-2xl" aria-hidden="true">🌳</span><h3 className="mt-3 font-black text-emerald-950">Plant Science Academy</h3><p className="mt-2 text-sm leading-6 text-slate-600">বাংলা/ইংরেজি নাম, বৈজ্ঞানিক নাম, উদ্ভিদ পরিবার, ফ্ল্যাশকার্ড ও কুইজ।</p><span className="mt-4 inline-block text-sm font-extrabold text-emerald-800">টুল খুলুন →</span></Link>
        <Link href="/learn/plant-disease" className="rounded-2xl border border-sky-200 bg-white p-5 transition hover:border-sky-500 hover:shadow-sm"><span className="text-2xl" aria-hidden="true">🩺</span><h3 className="mt-3 font-black text-slate-950">Plant Disease Learning Lab</h3><p className="mt-2 text-sm leading-6 text-slate-600">লক্ষণ পর্যবেক্ষণ, সম্ভাব্য মিল, কেস স্টাডি, নিরাপত্তা নির্দেশনা ও কুইজ।</p><span className="mt-4 inline-block text-sm font-extrabold text-sky-800">ল্যাব খুলুন →</span></Link>
      </div>
    </section>
    <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">কৃষি বিষয়ে স্থানীয় মাটি, জাত, মৌসুম ও আবহাওয়া অনুযায়ী পরামর্শ ভিন্ন হতে পারে। নির্দিষ্ট মাত্রা বা রোগের চিকিৎসা প্রয়োগের আগে স্থানীয় কৃষি কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন।</aside>
  </div></main>;
}
