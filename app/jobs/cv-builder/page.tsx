import type { Metadata } from "next";
import CVBuilderClient from "@/components/jobs/CVBuilderClient";

export const metadata: Metadata = {
  title: "কৃষি চাকরির জন্য CV Builder",
  description: "বাংলা বা ইংরেজিতে পেশাদার CV তৈরি করুন, কাজের অভিজ্ঞতা ও দক্ষতা সাজান, ডিজাইন বেছে PDF ডাউনলোড করুন।",
  alternates: { canonical: "/jobs/cv-builder" },
};

export default function CVBuilderPage() {
  return (
    <div className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <header className="bg-gradient-to-br from-[#103f2b] to-[#24734a] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-black sm:text-4xl">কৃষি চাকরির জন্য CV Builder</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">বাংলা বা ইংরেজিতে নিজের শিক্ষাগত যোগ্যতা, কাজের অভিজ্ঞতা ও দক্ষতা সাজিয়ে পেশাদার CV তৈরি করুন। পছন্দের টেমপ্লেট বেছে নিয়ে PDF হিসেবে সংরক্ষণ করতে পারবেন।</p>
        </div>
      </header>
      <CVBuilderClient />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">কৃষি চাকরির CV-তে কী কী রাখবেন?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">চাকরির ধরন অনুযায়ী তথ্য সাজালে নিয়োগদাতা আপনার যোগ্যতা দ্রুত বুঝতে পারেন। CV-তে সংক্ষিপ্ত, সত্য এবং পদটির সঙ্গে প্রাসঙ্গিক তথ্য দিন।</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl bg-emerald-50 p-5">
              <h3 className="font-extrabold">ব্যক্তিগত পরিচিতি ও যোগাযোগ</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">পূর্ণ নাম, সচল ফোন, ইমেইল এবং প্রয়োজন হলে জেলা/এলাকা লিখুন। ২–৩ লাইনে কোন কাজ খুঁজছেন ও আপনার প্রাসঙ্গিক শক্তি তুলে ধরুন।</p>
            </article>
            <article className="rounded-2xl bg-emerald-50 p-5">
              <h3 className="font-extrabold">শিক্ষা, প্রশিক্ষণ ও দক্ষতা</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">ডিগ্রি বা প্রশিক্ষণের নাম, প্রতিষ্ঠান ও সাল যোগ করুন। মাঠ পর্যায়ের কাজ, ফসল পরিচর্যা, যন্ত্র চালনা, ডেটা সংগ্রহ বা কম্পিউটার দক্ষতা—যা সত্যিই পারেন তা উল্লেখ করুন।</p>
            </article>
            <article className="rounded-2xl bg-emerald-50 p-5">
              <h3 className="font-extrabold">কাজের অভিজ্ঞতা ও অর্জন</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">সর্বশেষ অভিজ্ঞতা আগে লিখুন। দায়িত্বের পাশাপাশি ফলাফল বা পরিমাপযোগ্য অবদান থাকলে সংক্ষেপে জানান; অভিজ্ঞতা না থাকলে ইন্টার্নশিপ, স্বেচ্ছাসেবা বা প্রাসঙ্গিক প্রকল্প তুলে ধরুন।</p>
            </article>
            <article className="rounded-2xl bg-emerald-50 p-5">
              <h3 className="font-extrabold">পদ অনুযায়ী CV সাজান</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">কৃষি কর্মকর্তা, নার্সারি কর্মী, খামার ব্যবস্থাপনা, বিক্রয় বা মাঠ সহকারী—প্রতিটি পদের বিজ্ঞপ্তি দেখে প্রাসঙ্গিক দক্ষতা ও অভিজ্ঞতা সামনে আনুন। বানান ও তারিখ যাচাই করুন।</p>
            </article>
          </div>
          <h2 className="mt-8 text-xl font-black">CV তৈরি ও PDF সংরক্ষণের ধাপ</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>উপরের ফর্মে তথ্য পূরণ করুন এবং প্রয়োজনীয় অভিজ্ঞতা/শিক্ষার এন্ট্রি যোগ করুন।</li>
            <li>বাংলা বা ইংরেজি ভাষা এবং সহজে পড়া যায় এমন টেমপ্লেট নির্বাচন করুন।</li>
            <li>প্রিভিউতে যোগাযোগের তথ্য, তারিখ ও ফরম্যাট যাচাই করুন।</li>
            <li>Save ব্যবহার করলে তথ্য এই ব্রাউজার/ডিভাইসে সংরক্ষিত হতে পারে; PDF সেভ করে নিজের নিরাপদ স্থানে রাখুন।</li>
          </ol>
          <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">গোপনীয়তা: CV-তে ব্যক্তিগত তথ্য থাকে। শেয়ার করা ডিভাইসে সংরক্ষণ এড়িয়ে চলুন এবং কাজ শেষে স্থানীয়ভাবে সেভ করা তথ্য মুছে ফেলুন।</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/jobs" className="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900">কৃষি চাকরি খুঁজুন</a>
            <a href="/jobs/post" className="rounded-xl border border-emerald-800/20 px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">চাকরি পোস্ট করুন</a>
          </div>
        </div>
      </section>
    </div>
  );
}
