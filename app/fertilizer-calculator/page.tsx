import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "সার হিসাব ক্যালকুলেটর: জমি অনুযায়ী সারের পরিমাণ",
  description: "একর, হেক্টর বা শতক অনুযায়ী জমির আয়তন ও নির্ধারিত সারের হার দিয়ে প্রয়োজনীয় সার হিসাব করুন।",
  alternates: { canonical: "/fertilizer-calculator", languages: { "bn-BD": "/fertilizer-calculator", en: "/en/fertilizer-calculator", "x-default": "/fertilizer-calculator" } },
  openGraph: { title: "সার হিসাব ক্যালকুলেটর | AGRIVA", description: "জমির আয়তন ও সারের হার দিয়ে মোট প্রয়োজনীয় পরিমাণ হিসাব করুন।", url: "/fertilizer-calculator", type: "website" },
  keywords: ["সার হিসাব", "সার হিসাব ক্যালকুলেটর", "জমি অনুযায়ী সারের পরিমাণ", "fertilizer calculator"],
};

export default function FertilizerCalculatorPage() {
  return (
    <>
      <StandaloneCalculator kind="fertilizer" locale="bn" />
      <article className="prose prose-green mx-auto mt-10 max-w-4xl px-4 pb-12 sm:px-6">
        <h2>সারের পরিমাণ কীভাবে হিসাব করবেন?</h2>
        <p>প্রথমে জমির সঠিক পরিমাণ ও একক লিখুন। এরপর মাটি পরীক্ষার ফল বা ফসলভিত্তিক নির্ভরযোগ্য স্থানীয় সুপারিশ থেকে সারের হার দিন। জমির একক ও সারের হারের একক মিলিয়ে নেওয়া জরুরি।</p>
        <h3>ফসল ও মাটির তথ্য কেন গুরুত্বপূর্ণ?</h3>
        <p>ফসলের জাত, বৃদ্ধির ধাপ, মাটির উর্বরতা এবং আগের সার প্রয়োগের ওপর প্রয়োজনীয় সারের পরিমাণ বদলায়। সব ফসল বা সব জমিতে একই হার প্রয়োগ করা ঠিক নয়।</p>
        <h3>সার প্রয়োগের আগে</h3>
        <p>সম্ভব হলে মাটি পরীক্ষা করুন, স্থানীয় কৃষি নির্দেশনা অনুসরণ করুন এবং পণ্যের লেবেল পড়ুন। এই ক্যালকুলেটর পরিকল্পনার সহায়ক, পেশাদার কৃষি পরামর্শের বিকল্প নয়।</p>
      </article>
    </>
  );
}
