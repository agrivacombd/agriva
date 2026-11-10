import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "বীজের হার ক্যালকুলেটর: জমি অনুযায়ী বীজের হিসাব",
  description: "একর, হেক্টর বা শতক অনুযায়ী জমির পরিমাণ ও বীজের হার দিয়ে প্রয়োজনীয় বীজের পরিমাণ বের করুন।",
  alternates: { canonical: "/seed-rate-calculator", languages: { "bn-BD": "/seed-rate-calculator", en: "/en/seed-rate-calculator", "x-default": "/seed-rate-calculator" } },
  openGraph: { title: "বীজের হিসাব ক্যালকুলেটর | AGRIVA", description: "জমির পরিমাণ ও বীজের হার দিয়ে আনুমানিক প্রয়োজনীয় বীজ হিসাব করুন।", url: "/seed-rate-calculator", type: "website" },
  keywords: ["বীজের হিসাব", "বীজের হার ক্যালকুলেটর", "জমি অনুযায়ী বীজ", "seed rate calculator"],
};

export default function SeedRateCalculatorPage() {
  return (
    <>
      <StandaloneCalculator kind="seed" locale="bn" />
      <article className="prose prose-green mx-auto mt-10 max-w-4xl px-4 pb-12 sm:px-6">
        <h2>বীজের প্রয়োজনীয় পরিমাণ কীভাবে হিসাব করবেন?</h2>
        <p>ফসল নির্বাচন করে জমির পরিমাণ লিখুন এবং ওই ফসল ও পদ্ধতির উপযোগী বীজের হার দিন। জমির একক ও বীজের হারের একক একই ভিত্তিতে আছে কি না যাচাই করুন।</p>
        <h3>কোন বিষয়গুলো বীজের হার বদলায়?</h3>
        <p>ফসলের জাত, বীজের অঙ্কুরোদ্গম, সরাসরি বপন বা চারা রোপণ, সারির দূরত্ব এবং মৌসুম অনুযায়ী বীজের প্রয়োজন বদলাতে পারে। এক ফসলের হার অন্য ফসলে ব্যবহার করবেন না।</p>
        <h3>বীজ কেনার আগে</h3>
        <p>বিশ্বস্ত উৎসের মানসম্মত বীজ নিন এবং প্যাকেটের জাত, মেয়াদ ও মানসংক্রান্ত তথ্য যাচাই করুন। ফলাফলটি আনুমানিক হিসাব; চূড়ান্ত হার স্থানীয় কৃষি পরামর্শ অনুযায়ী ঠিক করুন।</p>
      </article>
    </>
  );
}
