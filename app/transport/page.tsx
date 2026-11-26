import type { Metadata } from "next";
import TransportBooking from "@/components/transport/TransportBooking";

export const metadata: Metadata = {
  title: "কৃষিপণ্য পরিবহন বুকিং",
  description: "কৃষিপণ্য পরিবহনের অনুরোধ দিন, যাচাইকৃত পরিবহন পার্টনারদের ভাড়ার অফার তুলনা করুন এবং বুকিংয়ের অবস্থা দেখুন।",
  alternates: { canonical: "/transport" },
};

export default function TransportPage() {
  return <>
    <TransportBooking />
    <section className="mx-auto max-w-5xl space-y-5 px-4 pb-12 text-slate-800 sm:px-6">
      <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">ফসল পরিবহনের জন্য যান ও ভাড়া তুলনা করুন</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">কৃষিপণ্য পরিবহনের অনুরোধে ফসল, পরিমাণ, কোথা থেকে কোথায় নিতে হবে, সংগ্রহের তারিখ ও উপযুক্ত যানবাহনের তথ্য দিন। পরিবহন পার্টনাররা অনুরোধ দেখে ভাড়া, পৌঁছানোর সম্ভাব্য সময় এবং লোডিং খরচসহ প্রস্তাব দিতে পারেন। অফার তুলনা করে শর্ত বুঝে পছন্দের প্রস্তাব গ্রহণ করুন।</p>
        <h2 className="mt-5 text-lg font-bold">কোন ধরনের যান বেছে নেবেন?</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
          <li>ভ্যান বা ছোট যান: কাছাকাছি এলাকার তুলনামূলক ছোট চালান ও স্থানীয় সংগ্রহে বিবেচনা করুন।</li>
          <li>পিকআপ বা ট্রাক: চালানের আকার, রাস্তা ও লোডিং সুবিধা অনুযায়ী বেছে নিন।</li>
          <li>কাভার্ড বা রেফ্রিজারেটেড যান: বৃষ্টি, ধুলো বা তাপমাত্রা-সংবেদনশীল পণ্যের প্রয়োজন বিবেচনা করে পার্টনারের সঙ্গে নিশ্চিত করুন।</li>
        </ul>
      </article>
      <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">বুকিং নিশ্চিত করার আগে</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">চূড়ান্ত ভাড়া, অতিরিক্ত লোডিং/আনলোডিং খরচ, পেমেন্টের সময়, পণ্য তোলার সময়, গাড়ির ধারণক্ষমতা এবং ক্ষতি হলে দায় কার—এসব লিখিতভাবে বা স্পষ্ট যোগাযোগে নিশ্চিত করুন। অফার গ্রহণ না করা পর্যন্ত বুকিং নিশ্চিত নয়। বুকিংয়ের অগ্রগতি পৃষ্ঠার স্ট্যাটাস থেকে দেখুন; এখানে লাইভ GPS ট্র্যাকিং বা অনলাইন পেমেন্ট সুবিধা নেই।</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">ফসল বিক্রির জন্য <a className="font-semibold text-emerald-800 underline" href="/buyer-demands">ক্রেতার চাহিদা</a> দেখুন, অথবা <a className="font-semibold text-emerald-800 underline" href="/krishi-bazar">কৃষি বাজার</a> থেকে বাজার সংক্রান্ত তথ্য ও বিক্রির সুযোগ খুঁজুন।</p>
      </article>
    </section>
  </>;
}
