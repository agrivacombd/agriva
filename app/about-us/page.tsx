import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে | AGRIVA",
  description: "AGRIVA—বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও কৃষি-সংশ্লিষ্ট মানুষের জন্য তৈরি একটি ডিজিটাল কৃষি প্ল্যাটফর্ম।",
  alternates: { canonical: "/about-us" },
};

const principles = [
  { title: "সহজে ব্যবহারযোগ্য", text: "কৃষির প্রয়োজনীয় তথ্য ও ডিজিটাল টুলস সহজ বাংলায়, যতটা সম্ভব সরলভাবে উপস্থাপন করা।" },
  { title: "সিদ্ধান্তে সহায়তা", text: "পরিকল্পনা, হিসাব ও তথ্য খুঁজে পাওয়ার সুবিধা দেওয়া—যাতে ব্যবহারকারী নিজের পরিস্থিতি অনুযায়ী সিদ্ধান্ত নিতে পারেন।" },
  { title: "কৃষি-কমিউনিটিকে সংযুক্ত করা", text: "কৃষক, ক্রেতা, বিক্রেতা, শিক্ষার্থী ও কৃষি-উদ্যোক্তাদের জন্য প্রয়োজনীয় ডিজিটাল সংযোগের সুযোগ তৈরি করা।" },
];

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-10 text-[#173629] sm:px-6 sm:py-16 lg:px-8">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm">
        <header className="bg-[#123f30] px-6 py-10 text-white sm:px-10 sm:py-14">
          <Link href="/" className="text-sm font-semibold text-emerald-100 transition hover:text-white">← AGRIVA হোম</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">আমাদের পরিচয়</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">কৃষির প্রতিটি ধাপে, আপনার পাশে</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">AGRIVA বাংলাদেশের কৃষি-সংশ্লিষ্ট মানুষের জন্য তৈরি একটি ডিজিটাল প্ল্যাটফর্ম। কৃষির প্রয়োজনীয় তথ্য, পরিকল্পনার টুলস এবং কৃষিপণ্য ও বাজার-সংক্রান্ত সুবিধা এক জায়গায় সহজে খুঁজে পেতে আমরা কাজ করছি।</p>
        </header>
        <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
          <section>
            <h2 className="text-2xl font-extrabold">আমাদের লক্ষ্য</h2>
            <p className="mt-4 leading-8 text-slate-600">কৃষির কাজ প্রতিদিনই নানা সিদ্ধান্তের সঙ্গে জড়িত—কোন ফসল বেছে নেবেন, কীভাবে খরচের হিসাব রাখবেন, বাজারের তথ্য কোথায় পাবেন, কিংবা কোনো সমস্যায় প্রাথমিক সহায়তা কীভাবে খুঁজবেন। AGRIVA-র লক্ষ্য হলো এসব কাজে সহায়ক ডিজিটাল সেবা ও তথ্যকে আরও সহজলভ্য করা।</p>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold">প্ল্যাটফর্মে কী কী পাবেন</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["কৃষিপণ্য ও মার্কেটপ্লেস", "বীজ ও কৃষি-সংশ্লিষ্ট পণ্যের তথ্য দেখা এবং উপলভ্য মার্কেটপ্লেস সুবিধা ব্যবহার করা।"],
                ["কৃষি জ্ঞান ও সহায়তা", "কৃষি বিষয়ক গাইড, AI-সহায়ক প্রশ্নোত্তর এবং ফসলের সমস্যা নিয়ে প্রাথমিক তথ্য খোঁজা।"],
                ["খামার পরিকল্পনা ও হিসাব", "খামারের রেকর্ড, ফসলের পরিকল্পনা এবং হিসাব-নিকাশে সহায়ক ডিজিটাল টুলস ব্যবহার করা।"],
                ["বাজার ও লজিস্টিকস", "বাজারদর, ফসল বিক্রি, ক্রেতার চাহিদা ও কৃষিপণ্য পরিবহন-সংক্রান্ত সুবিধা খুঁজে দেখা।"],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">কোনো ফিচারের প্রাপ্যতা বা ফলাফল নির্ভর করতে পারে সেটির বর্তমান অবস্থা, আপনার দেওয়া তথ্য এবং সংশ্লিষ্ট সেবার শর্তের ওপর।</p>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold">আমাদের কাজের নীতি</h2>
            <div className="mt-5 space-y-4">
              {principles.map((item) => <div key={item.title} className="border-l-2 border-emerald-600 pl-4"><h3 className="font-bold">{item.title}</h3><p className="mt-1 leading-7 text-slate-600">{item.text}</p></div>)}
            </div>
          </section>
          <section className="rounded-2xl bg-[#f8f8f1] p-5 sm:p-6">
            <h2 className="text-xl font-extrabold">একটি গুরুত্বপূর্ণ কথা</h2>
            <p className="mt-3 leading-8 text-slate-600">AGRIVA-র তথ্য, ক্যালকুলেটর বা AI-উৎপন্ন উত্তর সাধারণ সহায়তার জন্য। এগুলো স্থানীয় আবহাওয়া, মাটি, জাত, রোগের অবস্থা বা সরকারি নির্দেশনার বিকল্প নয়। গুরুত্বপূর্ণ কৃষি সিদ্ধান্তের আগে প্রয়োজন অনুযায়ী কৃষি কর্মকর্তা বা যোগ্য বিশেষজ্ঞের পরামর্শ নিন।</p>
            <Link href="/contact-us" className="mt-5 inline-flex items-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900">AGRIVA-র সঙ্গে যোগাযোগ করুন</Link>
          </section>
        </div>
      </article>
    </main>
  );
}
