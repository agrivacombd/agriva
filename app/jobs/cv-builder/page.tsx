import type { Metadata } from "next";
import CVBuilderClient from "@/components/jobs/CVBuilderClient";

export const metadata: Metadata = {
  title: "কৃষি চাকরির CV তৈরি করুন | AGRIVA",
  description: "বাংলা বা ইংরেজিতে পেশাদার CV তৈরি করুন, ডিজাইন বেছে নিন এবং PDF হিসেবে ডাউনলোড করুন।",
  alternates: { canonical: "/jobs/cv-builder" },
  keywords: ["কৃষি চাকরির CV", "বাংলা CV তৈরি", "কৃষি CV builder", "PDF CV"],
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
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-emerald-100 bg-white p-6">
            <h2 className="text-xl font-extrabold">CV-তে কী তথ্য রাখবেন?</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
              <li>• নাম, সচল ফোন ও ইমেইল—যোগাযোগের তথ্য নির্ভুল রাখুন।</li>
              <li>• শিক্ষাগত যোগ্যতা, প্রতিষ্ঠান ও পাশের বছর উল্লেখ করুন।</li>
              <li>• কৃষি মাঠকাজ, ইন্টার্নশিপ, প্রশিক্ষণ বা স্বেচ্ছাসেবার অভিজ্ঞতা লিখুন।</li>
              <li>• প্রাসঙ্গিক দক্ষতা—যেমন মাঠ জরিপ, ডেটা সংগ্রহ, কম্পিউটার বা কৃষি যন্ত্র পরিচালনা—সত্য ও নির্দিষ্টভাবে তুলে ধরুন।</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-white p-6">
            <h2 className="text-xl font-extrabold">ভালো CV তৈরির কয়েকটি পরামর্শ</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
              <li>• যে চাকরিতে আবেদন করবেন, তার দায়িত্বের সঙ্গে মিল রেখে CV সাজান।</li>
              <li>• অভিজ্ঞতা না থাকলে প্রজেক্ট, কোর্স, মাঠ-পর্যবেক্ষণ ও শেখা দক্ষতা লিখুন।</li>
              <li>• বানান, ফোন নম্বর ও তারিখ যাচাই করে PDF সংরক্ষণ করুন।</li>
              <li>• অপ্রাসঙ্গিক ব্যক্তিগত তথ্য দেবেন না। শেয়ার করা ডিভাইসে CV সেভ রাখার আগে সতর্ক থাকুন।</li>
            </ul>
          </article>
        </div>
        <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-sm leading-7 text-emerald-950">
          CV তৈরি হলে AGRIVA Jobs-এ কৃষি ও মাঠকাজের সুযোগ দেখতে পারেন। <a href="/jobs" className="font-bold underline">কৃষি চাকরি দেখুন →</a>
        </div>
      </section>
    </div>
  );
}
