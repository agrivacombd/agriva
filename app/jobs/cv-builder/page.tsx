import type { Metadata } from "next";
import CVBuilderClient from "@/components/jobs/CVBuilderClient";

export const metadata: Metadata = {
  title: "কৃষি চাকরির জন্য CV Builder",
  description: "বাংলা বা ইংরেজিতে পেশাদার CV তৈরি করুন, ডিজাইন বেছে নিন এবং PDF হিসেবে ডাউনলোড করুন।",
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
    </div>
  );
}
