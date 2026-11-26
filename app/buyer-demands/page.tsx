import type { Metadata } from "next";
import BuyerDemandBoard from "@/components/marketplace/BuyerDemandBoard";

export const metadata: Metadata = {
  title: "ক্রেতার চাহিদা",
  description: "ক্রেতারা কী ফসল, কত পরিমাণ, কোথায় ও কবে চান তা দেখুন। আপনার কাছে ফসল থাকলে আগ্রহ জানান এবং সরাসরি যোগাযোগ করুন।",
  alternates: { canonical: "/buyer-demands" },
  keywords: ["কৃষিপণ্যের ক্রেতা", "ফসল বিক্রির চাহিদা", "ধান ক্রেতা", "কৃষক বাজার"],
};

export default function BuyerDemandsPage() {
  return <>
    <BuyerDemandBoard />
    <section className="mx-auto max-w-5xl px-4 pb-12">
      <div className="grid gap-5 sm:grid-cols-2">
        <article className="rounded-2xl border border-emerald-100 bg-white p-5">
          <h2 className="text-lg font-extrabold">ক্রেতার চাহিদা কীভাবে ব্যবহার করবেন?</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">ফসলের নাম, পরিমাণ, জেলা, প্রয়োজনের সময় এবং মূল্য-শর্ত দেখে আপনার উৎপাদনের সঙ্গে মিল আছে কি না যাচাই করুন। উপযুক্ত চাহিদায় আগ্রহ জানালে ক্রেতার সঙ্গে পরবর্তী আলোচনা করতে পারবেন।</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white p-5">
          <h2 className="text-lg font-extrabold">চাহিদা পোস্ট করার আগে</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">পণ্যের ধরন, পরিমাণ ও একক, সংগ্রহের এলাকা, সম্ভাব্য সময়, মূল্য পদ্ধতি এবং পরিবহনের ব্যবস্থা স্পষ্ট লিখুন। যোগাযোগের তথ্য প্রকাশের বিকল্প থাকলে গোপনীয়তা বিবেচনা করে নির্বাচন করুন।</p>
        </article>
      </div>
      <p className="mt-5 text-sm leading-7 text-slate-500">পোস্টের তথ্য ও লেনদেনের শর্ত সরাসরি সংশ্লিষ্ট পক্ষের সঙ্গে যাচাই করুন। AGRIVA-তে প্রকাশিত চাহিদা বাজারের নিশ্চয়তা নয়।</p>
    </section>
  </>;
}
