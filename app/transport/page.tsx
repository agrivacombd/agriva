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
    <section className="mx-auto max-w-5xl px-4 pb-12">
      <div className="grid gap-5 sm:grid-cols-2">
        <article className="rounded-2xl border border-emerald-100 bg-white p-6">
          <h2 className="text-lg font-extrabold">কৃষিপণ্য পরিবহন অনুরোধের তথ্য</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">পণ্য ও পরিমাণ, কোথা থেকে কোথায় যাবে, লোড করার তারিখ, উপযুক্ত গাড়ি এবং লোডিং সহায়তা লাগবে কি না—এসব তথ্য পরিষ্কার দিলে পরিবহন অফার তুলনা সহজ হয়। বাজেট থাকলে তা উল্লেখ করতে পারেন।</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white p-6">
          <h2 className="text-lg font-extrabold">অফার ও বুকিং নিশ্চিত করার আগে</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">ভাড়া, অতিরিক্ত চার্জ, গাড়ির ধারণক্ষমতা, পৌঁছানোর সময়, পণ্য সুরক্ষা ও যোগাযোগের তথ্য সরাসরি যাচাই করুন। বুকিং নিশ্চিত হওয়ার আগে অর্থপ্রদান বা শর্ত সম্পর্কে উভয় পক্ষের স্পষ্ট সম্মতি নিন।</p>
        </article>
      </div>
      <p className="mt-5 text-sm leading-7 text-slate-500">AGRIVA-তে দেখানো অফার ও পার্টনারের তথ্য যাচাই করে সিদ্ধান্ত নিন। পরিবহন চুক্তির শর্ত সংশ্লিষ্ট পক্ষের সঙ্গে নিশ্চিত করা প্রয়োজন।</p>
    </section>
  </>;
}
