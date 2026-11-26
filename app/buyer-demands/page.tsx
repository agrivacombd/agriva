import type { Metadata } from "next";
import BuyerDemandBoard from "@/components/marketplace/BuyerDemandBoard";

export const metadata: Metadata = {
  title: "ক্রেতার চাহিদা",
  description: "ক্রেতারা কী ফসল, কত পরিমাণ, কোথায় ও কবে চান তা দেখুন। আপনার কাছে ফসল থাকলে আগ্রহ জানান এবং সরাসরি যোগাযোগ করুন।",
  alternates: { canonical: "/buyer-demands" },
};

export default function BuyerDemandsPage() {
  return <>
    <BuyerDemandBoard />
    <section className="mx-auto max-w-5xl space-y-6 px-4 pb-12 text-slate-800 sm:px-6">
      <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">ক্রেতার চাহিদা দেখে ফসল বিক্রির সুযোগ খুঁজুন</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">এই বোর্ডে ক্রেতারা ফসলের নাম, জাত, পরিমাণ, সম্ভাব্য দাম, জেলা, সরবরাহের সময় ও পরিবহনের শর্ত দিয়ে চাহিদা পোস্ট করতে পারেন। কৃষকরা তালিকা দেখে নিজের মজুদ বা আসন্ন সংগ্রহের সঙ্গে মেলে এমন চাহিদায় আগ্রহ জানাতে পারেন। চাহিদা সক্রিয় কি না এবং আংশিক সরবরাহ গ্রহণ করা হবে কি না, পোস্টের তথ্য পড়ে নিন।</p>
        <h2 className="mt-5 text-lg font-bold">আগ্রহ জানানোর আগে কী যাচাই করবেন?</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
          <li>ফসলের ধরন, জাত, গুণমান ও পরিমাণ আপনার সরবরাহের সঙ্গে মেলে কি না।</li>
          <li>দর নির্দিষ্ট, বাজারদরভিত্তিক নাকি আলোচনা সাপেক্ষ—এবং এককটি কেজি, মণ, টন বা বস্তা কি না।</li>
          <li>সরবরাহের তারিখ, সংগ্রহের স্থান, পরিবহন ও আংশিক সরবরাহের শর্ত পরিষ্কার কি না।</li>
          <li>লেনদেনের আগে ক্রেতার সঙ্গে মূল্য, ওজন, পেমেন্ট এবং পণ্য হস্তান্তরের বিষয় নিশ্চিত করুন।</li>
        </ul>
      </article>
      <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">কীভাবে চাহিদা পোস্ট করবেন?</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">লগইন করে চাহিদা যোগ করার ফর্মে ফসল, পরিমাণ ও একক, জেলা/উপজেলা, দাম ও সরবরাহের সময় বেছে নিন। বিস্তারিত নোট দিলে বিক্রেতারা পণ্যের মান, সংগ্রহ বা ডেলিভারি সম্পর্কে আগেই বুঝতে পারবেন। আগ্রহের উত্তর এলে নিজের পোস্টের তালিকা থেকে যোগাযোগ ও প্রস্তাব পর্যালোচনা করুন।</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">ফসলের বিকল্প বাজার খুঁজতে <a className="font-semibold text-emerald-800 underline" href="/krishi-bazar">AGRIVA কৃষি বাজার</a> এবং কৃষিপণ্যের তালিকা দেখতে <a className="font-semibold text-emerald-800 underline" href="/marketplace">মার্কেটপ্লেস</a> ব্যবহার করতে পারেন।</p>
      </article>
    </section>
  </>;
}
