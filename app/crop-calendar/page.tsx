import type { Metadata } from "next";
import CropCalendarPanel from "@/components/crop-calendar/CropCalendarPanel";

export const metadata: Metadata = {
  title: "আমার ফসল ক্যালেন্ডার",
  description: "বাংলাদেশের কৃষকদের জন্য ফসলভিত্তিক কাজের চেকলিস্ট ও ব্রাউজারে সংরক্ষিত চাষ পরিকল্পনা।",
  alternates: { canonical: "/crop-calendar", languages: { "bn-BD": "/crop-calendar", en: "/en/crop-calendar", "x-default": "/crop-calendar" } },
  openGraph: { title: "ফসল ক্যালেন্ডার ও কাজের চেকলিস্ট | AGRIVA", description: "ফসলভিত্তিক কাজের চেকলিস্ট ও চাষ পরিকল্পনা ব্রাউজারে সংরক্ষণ করুন।", url: "/crop-calendar", type: "website", locale: "bn_BD" },
  keywords: ["ফসল ক্যালেন্ডার", "চাষের কাজের তালিকা", "ফসল পরিকল্পনা", "crop calendar"],
};

export default function CropCalendarPage() {
  return <>
    <CropCalendarPanel />
    <section className="mx-auto max-w-4xl px-4 pb-12">
      <div className="rounded-2xl border border-emerald-100 bg-white p-6">
        <h2 className="text-xl font-extrabold">ক্যালেন্ডারটি পরিকল্পনায় কীভাবে কাজে লাগাবেন?</h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
          <p>ফসল বেছে নিয়ে চাষ শুরু বা রোপণের তারিখ লিখুন। জমি প্রস্তুতি, বীজ বা চারা, পানি ব্যবস্থাপনা, আগাছা ও রোগবালাই পর্যবেক্ষণ এবং সংগ্রহের কাজগুলো একে একে চিহ্নিত করুন।</p>
          <p>এই তালিকা সাধারণ পরিকল্পনার সহায়ক; এটি নির্দিষ্ট তারিখভিত্তিক কৃষি পূর্বাভাস নয়। জাত, অঞ্চল, আবহাওয়া ও মাঠের অবস্থা অনুযায়ী কাজের সময় ঠিক করুন এবং স্থানীয় কৃষি পরামর্শ অনুসরণ করুন।</p>
          <p>চেকলিস্ট এই ব্রাউজারে সংরক্ষিত থাকে। অন্য ডিভাইসে স্বয়ংক্রিয়ভাবে সিঙ্ক হয় না—ডিভাইস বদলালে তথ্য আবার লিখতে হতে পারে।</p>
        </div>
        <a href="/learn" className="mt-4 inline-block font-bold text-emerald-800 underline">চাষাবাদের গাইড পড়ুন →</a>
      </div>
    </section>
  </>;
}
