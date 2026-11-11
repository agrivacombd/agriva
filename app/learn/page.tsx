import type { Metadata } from "next";
import Link from "next/link";
import LearnLibrary from "@/components/learn/LearnLibrary";
import { LESSONS } from "@/lib/learn/lessons";

export const metadata: Metadata = {
  title: "কৃষি শেখার কেন্দ্র: ধান, সবজি, মাটি ও রোগবালাই",
  description: "বাংলাদেশি কৃষকদের জন্য সহজ বাংলায় ধাপে ধাপে কৃষি গাইড, ব্যবহারিক পরামর্শ ও কুইজ। ফসল, মাটি ও সমন্বিত বালাই ব্যবস্থাপনা শিখুন।",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "কৃষি শেখার কেন্দ্র | AGRIVA",
    description: "ফসল চাষ, মাটির স্বাস্থ্য ও সমন্বিত বালাই ব্যবস্থাপনা শিখুন।",
    url: "/learn",
    type: "website",
  },
};

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/tools" className="text-sm font-bold text-emerald-800 hover:underline">← কৃষি টুলবক্স</Link>

        <header className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 p-6 text-white sm:p-10">
          <p className="text-sm font-bold text-emerald-200">AGRIVA · শিখুন, অনুশীলন করুন, প্রয়োগ করুন</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">কৃষি শেখার কেন্দ্র</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">
            সহজ বাংলায় কৃষির প্রয়োজনীয় জ্ঞান শিখুন, ধাপে ধাপে গাইড অনুসরণ করুন এবং কুইজ দিয়ে নিজের বোঝাপড়া যাচাই করুন।
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-emerald-50">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">ধাপে ধাপে গাইড</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">ব্যবহারিক শেখা</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">নিজেকে যাচাই করুন</span>
          </div>
        </header>

        <LearnLibrary lessons={LESSONS} />

        <section className="mt-12" aria-labelledby="special-learning-heading">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">বিশেষায়িত অনুশীলন</p>
            <h2 id="special-learning-heading" className="mt-2 text-2xl font-black text-emerald-950">আরও গভীরভাবে শিখুন</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              উদ্ভিদবিজ্ঞান ও রোগের লক্ষণ পর্যবেক্ষণের জন্য AGRIVA-র বিদ্যমান interactive learning tools ব্যবহার করুন।
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Link href="/learn/plant-science" className="group rounded-2xl border border-emerald-200 bg-white p-5 transition hover:border-emerald-500 hover:shadow-sm">
              <span className="text-2xl" aria-hidden="true">🌳</span>
              <h3 className="mt-3 font-black text-emerald-950">Plant Science Academy</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">বাংলা ও ইংরেজি নাম, বৈজ্ঞানিক নাম, উদ্ভিদ পরিবার, ফ্ল্যাশকার্ড এবং কুইজের মাধ্যমে উদ্ভিদবিজ্ঞান অনুশীলন করুন।</p>
              <span className="mt-4 inline-block text-sm font-extrabold text-emerald-800 group-hover:underline">একাডেমি খুলুন →</span>
            </Link>
            <Link href="/learn/plant-disease" className="group rounded-2xl border border-sky-200 bg-white p-5 transition hover:border-sky-500 hover:shadow-sm">
              <span className="text-2xl" aria-hidden="true">🩺</span>
              <h3 className="mt-3 font-black text-slate-950">Plant Disease Learning Lab</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">লক্ষণ পর্যবেক্ষণ, সম্ভাব্য মিল, কেস স্টাডি, নিরাপত্তা নির্দেশনা এবং সংশোধনী জানানোর সুবিধা ব্যবহার করুন।</p>
              <span className="mt-4 inline-block text-sm font-extrabold text-sky-800 group-hover:underline">ল্যাব খুলুন →</span>
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7" aria-labelledby="learning-method-heading">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">কীভাবে শিখবেন</p>
          <h2 id="learning-method-heading" className="mt-2 text-xl font-black text-emerald-950">পড়ুন → বুঝুন → যাচাই করুন → প্রয়োগ করুন</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["১", "বিষয় বেছে নিন", "ফসল বা কৃষি সমস্যার সঙ্গে মেলে এমন গাইড খুঁজুন।"],
              ["২", "ধাপগুলো পড়ুন", "প্রতিটি ধাপ ও সতর্কতা মনোযোগ দিয়ে বুঝুন।"],
              ["৩", "কুইজ দিন", "গাইডের শেষে নিজের বোঝাপড়া যাচাই করুন।"],
              ["৪", "স্থানীয়ভাবে মিলিয়ে নিন", "নিজের জমি ও এলাকার জন্য সরকারি বা বিশেষজ্ঞ পরামর্শ যাচাই করুন।"],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl bg-white p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-800 text-sm font-black text-white">{number}</span>
                <h3 className="mt-3 font-extrabold text-emerald-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          <strong>গুরুত্বপূর্ণ কৃষি-নিরাপত্তা নোট:</strong> কৃষি বিষয়ে স্থানীয় মাটি, জাত, মৌসুম ও আবহাওয়া অনুযায়ী পরামর্শ ভিন্ন হতে পারে। নির্দিষ্ট মাত্রা, সার প্রয়োগ বা রোগের চিকিৎসা প্রয়োগের আগে স্থানীয় কৃষি কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন। লক্ষণভিত্তিক শেখার উপকরণ নিশ্চিত রোগ নির্ণয়ের বিকল্প নয়।
        </aside>
      </div>
    </main>
  );
}
