import Link from "next/link";
import type { Metadata } from "next";
import CookieSettingsButton from "@/components/analytics/CookieSettingsButton";

export const metadata: Metadata = {
  title: "কুকি ও ট্র্যাকিং নীতি | AGRIVA",
  description: "AGRIVA-র প্রয়োজনীয় কুকি, GA4 Analytics, Meta Pixel, Consent Mode v2 এবং Cookie Settings সম্পর্কে জানুন।",
  alternates: { canonical: "/cookie-policy" },
};

const categories = [
  {
    name: "প্রয়োজনীয় (Always on)",
    status: "সাইট চালানোর জন্য",
    description: "লগইন/সেশন, নিরাপত্তা, কার্ট বা প্রয়োজনীয় ব্যবহার-অবস্থা পরিচালনায় কুকি বা স্থানীয় স্টোরেজ ব্যবহার হতে পারে। এগুলো Analytics বা বিজ্ঞাপন পিক্সেল নয়।",
  },
  {
    name: "Analytics (ঐচ্ছিক)",
    status: "শুধু সম্মতিতে",
    description: "Google Analytics 4 (GA4) ব্যবহারকারীরা কোন পৃষ্ঠা বা ফিচার ব্যবহার করছেন তা পরিমাপ করতে পারে। সাইটে Analytics-এর অনুমতি না থাকলে GA4 tag লোড হয় না।",
  },
  {
    name: "Marketing (ঐচ্ছিক)",
    status: "শুধু সম্মতিতে",
    description: "Meta Pixel বিজ্ঞাপনের কার্যকারিতা বোঝার জন্য PageView, পণ্য দেখা, AddToCart, Checkout বা Purchase-সংক্রান্ত ইভেন্ট পরিমাপ করতে পারে। অনুমতি ছাড়া Pixel লোড হয় না।",
  },
];

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-10 text-[#173629] sm:px-6 sm:py-16 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
        <Link href="/" className="text-sm font-semibold text-emerald-800 transition hover:underline">← AGRIVA হোম</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Cookie & Consent Preferences</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">কুকি ও ট্র্যাকিং নীতি</h1>
        <p className="mt-4 text-sm text-slate-500">সর্বশেষ হালনাগাদ: ১৫ নভেম্বর ২০২৬</p>
        <p className="mt-6 leading-8 text-slate-600">AGRIVA-তে কুকি ও ব্রাউজার স্টোরেজের সব ব্যবহার এক নয়। কিছু সাইট চালানোর জন্য প্রয়োজন, আর Analytics এবং Marketing আলাদা অনুমতির ওপর নির্ভর করে।</p>
        <section className="mt-8">
          <h2 className="text-xl font-extrabold">১. কোন ধরনের প্রযুক্তি ব্যবহার হয়</h2>
          <div className="mt-5 grid gap-4">
            {categories.map((category) => (
              <div key={category.name} className="rounded-2xl border border-emerald-100 bg-[#fbfdf9] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-[#173629]">{category.name}</h3>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">{category.status}</span>
                </div>
                <p className="mt-3 leading-7 text-slate-600">{category.description}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-9 border-t border-slate-100 pt-7">
          <h2 className="text-xl font-extrabold">২. কীভাবে আপনার পছন্দ পরিবর্তন করবেন</h2>
          <p className="mt-3 leading-8 text-slate-600">এই পেজের <strong>Cookie settings পরিবর্তন করুন</strong> বাটনে চাপলে পছন্দের ডায়ালগ খুলবে। সেখানে Analytics ও Marketing আলাদাভাবে চালু/বন্ধ করে <strong>পছন্দ সংরক্ষণ</strong> করুন। প্রথম ভিজিটে শুধু প্রয়োজনীয় কুকি গ্রহণের বিকল্পও রয়েছে।</p>
          <p className="mt-3 leading-8 text-slate-600">আপনার অনুমতি ব্রাউজারের <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">agriva_privacy_consent_v1</code> localStorage key-তে রাখা হয়, যাতে পরবর্তী ভিজিটে একই পছন্দ বজায় থাকে। ব্রাউজারের স্টোরেজ পরিষ্কার করলে আবার অনুমতি বেছে নিতে হতে পারে।</p>
          <CookieSettingsButton />
        </section>
        <section className="mt-9 border-t border-slate-100 pt-7">
          <h2 className="text-xl font-extrabold">৩. Google Consent Mode v2</h2>
          <p className="mt-3 leading-8 text-slate-600">AGRIVA-তে Google Analytics-এর জন্য Basic Consent Mode v2 অনুসরণ করা হয়: অনুমতি না থাকলে GA4 tag লোড হয় না; Analytics অনুমতির পর প্রয়োজনীয় consent signal পাঠিয়ে পরিসংখ্যান সংগ্রহ শুরু হয়। বিজ্ঞাপন-সংক্রান্ত consent signal-ও আপনার Marketing পছন্দ অনুযায়ী নিয়ন্ত্রিত হয়।</p>
          <p className="mt-3 leading-8 text-slate-600">Google Tag Manager-এর ID Admin Settings-এ সংরক্ষিত থাকলেও এই মুহূর্তে সেটি আলাদা ট্র্যাকিং চালু করার নির্দেশ নয়। একই ইভেন্ট একাধিকবার গণনা এড়াতে পৃথক tag ব্যবহারে সতর্কতা রাখা হয়।</p>
        </section>
        <section className="mt-9 border-t border-slate-100 pt-7">
          <h2 className="text-xl font-extrabold">৪. অনুমতি প্রত্যাহারের প্রভাব</h2>
          <p className="mt-3 leading-8 text-slate-600">আপনি Analytics বা Marketing অনুমতি বন্ধ করলে সেই অনুযায়ী ভবিষ্যৎ ঐচ্ছিক ইভেন্ট বন্ধ করার ব্যবস্থা রয়েছে। তবে অনুমতি থাকা অবস্থায় তৃতীয় পক্ষের কাছে ইতিমধ্যে পাঠানো তথ্য নিজে থেকে মুছে যায় না; সে বিষয়ে সংশ্লিষ্ট সেবার নীতি এবং আপনার অনুরোধ প্রযোজ্য হতে পারে।</p>
          <p className="mt-3 leading-8 text-slate-600">ব্রাউজারের ad blocker, গোপনীয়তা সেটিংস বা নেটওয়ার্ক বিধিনিষেধের কারণে অনুমতি দেওয়া থাকলেও কোনো তৃতীয় পক্ষের tag কাজ নাও করতে পারে।</p>
        </section>
        <section className="mt-9 border-t border-slate-100 pt-7">
          <h2 className="text-xl font-extrabold">৫. আরও তথ্য ও যোগাযোগ</h2>
          <p className="mt-3 leading-8 text-slate-600">ব্যক্তিগত তথ্য, প্রকাশ্য পোস্ট, AI-সহায়ক সেবা, তথ্য সংরক্ষণ ও আপনার অনুরোধ সম্পর্কে বিস্তারিত <Link href="/privacy-policy" className="font-semibold text-emerald-800 underline">গোপনীয়তা নীতিতে</Link> রয়েছে। প্রশ্ন থাকলে <a href="mailto:Agriva.com.bd@gmail.com" className="font-semibold text-emerald-800 underline">Agriva.com.bd@gmail.com</a> ঠিকানায় যোগাযোগ করুন।</p>
        </section>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/privacy-policy" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-900 hover:bg-emerald-100">Privacy Policy</Link>
          <Link href="/terms-of-service" className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50">Terms of Service</Link>
          <Link href="/contact-us" className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50">যোগাযোগ করুন</Link>
        </div>
      </article>
    </main>
  );
}
