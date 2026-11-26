import type { Metadata } from "next";
import Link from "next/link";
import CropCalendarPanel from "@/components/crop-calendar/CropCalendarPanel";

export const metadata: Metadata = {
  title: "চাষের কাজের তালিকা ও ব্যক্তিগত ফসল ক্যালেন্ডার | AGRIVA",
  description: "ফসলের বপন, পরিচর্যা ও কাটার কাজ checklist-এ সাজান এবং অগ্রগতি এই ব্রাউজারে সংরক্ষণ করুন।",
  alternates: { canonical: "/crop-calendar", languages: { "bn-BD": "/crop-calendar", en: "/en/crop-calendar", "x-default": "/crop-calendar" } },
  openGraph: { title: "ব্যক্তিগত ফসল ক্যালেন্ডার ও চাষের কাজের তালিকা | AGRIVA", description: "ফসলের কাজ সাজান, checklist-এ অগ্রগতি চিহ্নিত করুন এবং ব্রাউজারে সংরক্ষণ করুন।", url: "/crop-calendar", type: "website", locale: "bn_BD" },
  keywords: ["ফসল ক্যালেন্ডার", "চাষের কাজের তালিকা", "ফসল পরিকল্পনা", "crop calendar"],
};

export default function CropCalendarPage() {
  return <>
    <CropCalendarPanel />
    <section className="mx-auto max-w-4xl space-y-5 px-4 pb-12 text-slate-800 sm:px-6">
      <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">ফসলের মৌসুম অনুযায়ী কাজ পরিকল্পনা করুন</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">ফসল ক্যালেন্ডার জমি প্রস্তুতি থেকে বীজ বা চারা নির্বাচন, সেচ, আগাছা ও রোগবালাই পর্যবেক্ষণ এবং সংগ্রহের প্রস্তুতি পর্যন্ত কাজ মনে রাখতে সাহায্য করে। এখানে ধান, গম, সবজি ও আলুর জন্য সাধারণ checklist রয়েছে। এটি নির্দিষ্ট তারিখের কৃষি নির্দেশিকা নয়—জাত, এলাকা, আবহাওয়া, জমি ও চাষপদ্ধতি অনুযায়ী কাজের সময় বদলাতে পারে।</p>
        <h2 className="mt-5 text-lg font-bold">চেকলিস্ট কীভাবে ব্যবহার করবেন</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600">
          <li>আপনার ফসল বেছে নিয়ে চাষ শুরু বা রোপণের তারিখ লিখুন।</li>
          <li>তালিকার কাজগুলো জমির অবস্থা দেখে সম্পন্ন করুন এবং checkbox-এ টিক দিন।</li>
          <li>চেকলিস্ট এই ব্রাউজারে সংরক্ষিত থাকে; অন্য ডিভাইসে স্বয়ংক্রিয়ভাবে sync হয় না।</li>
          <li>নতুন মৌসুম বা ফসলের জন্য তালিকা reset করে আবার শুরু করুন।</li>
        </ol>
      </article>
      <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">কাজের সময় নির্ধারণে নির্ভরযোগ্য তথ্য</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">সঠিক বপন বা রোপণের সময়, সার প্রয়োগ, সেচ এবং বালাই ব্যবস্থাপনার সিদ্ধান্তে স্থানীয় কৃষি অফিস বা কৃষি সম্প্রসারণ অধিদপ্তরের পরামর্শ অনুসরণ করুন। পরিকল্পনার সঙ্গে আবহাওয়া ও জমির আর্দ্রতা বিবেচনা করুন।</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">পরিকল্পনার পাশাপাশি <a className="font-semibold text-emerald-800 underline" href="/weather">স্থানীয় আবহাওয়া</a> দেখুন, প্রয়োজন হলে <a className="font-semibold text-emerald-800 underline" href="/soil-fertilizer">মাটি ও সার পরিকল্পনা</a> এবং <a className="font-semibold text-emerald-800 underline" href="/learn">কৃষি শেখার গাইড</a> ব্যবহার করুন। জাতীয় বপন ও ফসল সংগ্রহের সময়সূচি জানতে <Link className="font-semibold text-emerald-800 underline" href="/tools/crop-calendar">বাংলাদেশের ফসল ক্যালেন্ডার</Link> দেখুন।</p>
      </article>
    </section>
  </>;
}
