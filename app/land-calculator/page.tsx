import type { Metadata } from "next";
import Link from "next/link";
import LandCalculatorClient from "@/components/tools/LandCalculatorClient";

export const metadata: Metadata = {
  title: "জমির হিসাব: শতাংশ, কাঠা, বিঘা ও একর",
  description: "বাংলাদেশে জমির পরিমাপ সহজে হিসাব করুন। শতাংশ, কাঠা, বিঘা, একর, বর্গফুট ও হেক্টর রূপান্তর, দৈর্ঘ্য-প্রস্থ দিয়ে ক্ষেত্রফল এবং জমির আনুমানিক দাম বের করুন।",
  alternates: { canonical: "/land-calculator" },
  keywords: ["জমির হিসাব", "জমির হিসাব ক্যালকুলেটর", "জমির পরিমাপ", "শতাংশ থেকে কাঠা", "কাঠা থেকে শতাংশ", "বিঘা থেকে শতাংশ", "একর থেকে শতাংশ", "জমির দাম হিসাব"],
  openGraph: {
    title: "জমির হিসাব করুন | AGRIVA Land Calculator",
    description: "শতাংশ, কাঠা, বিঘা, একর ও বর্গফুটে জমির হিসাব করুন—ফ্রি অনলাইন ক্যালকুলেটর।",
    url: "/land-calculator",
    type: "website",
    locale: "bn_BD",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "১ শতাংশ জমি কত বর্গফুট?", acceptedAnswer: { "@type": "Answer", text: "১ শতাংশ বা ডেসিমেল সমান ৪৩৫.৬ বর্গফুট।" } },
    { "@type": "Question", name: "১ কাঠা কত শতাংশ?", acceptedAnswer: { "@type": "Answer", text: "৭২০ বর্গফুটের প্রচলিত কাঠা অনুযায়ী ১ কাঠা প্রায় ১.৬৫৩ শতাংশ। অঞ্চলভেদে মাপ ভিন্ন হতে পারে।" } },
    { "@type": "Question", name: "১ বিঘা কত শতাংশ?", acceptedAnswer: { "@type": "Answer", text: "১৪,৪০০ বর্গফুটের প্রচলিত বিঘা অনুযায়ী ১ বিঘা প্রায় ৩৩.০৬ শতাংশ। স্থানীয় মাপ যাচাই করুন।" } },
  ],
};

export default function LandCalculatorPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f5] pb-16 text-[#17351f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <section className="bg-[#075d45] text-white">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-5 text-xs font-semibold text-emerald-100">
            <Link href="/" className="hover:text-white">হোম</Link><span className="mx-2">/</span><Link href="/marketplace" className="hover:text-white">মার্কেটপ্লেস</Link><span className="mx-2">/</span><span aria-current="page">জমির হিসাব</span>
          </nav>
          <p className="text-xs font-extrabold tracking-[.18em] text-lime-200">AGRIVA • FREE LAND TOOL</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">জমির হিসাব করুন সহজেই</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base sm:leading-8">শতাংশ, কাঠা, বিঘা, একর ও বর্গফুটে জমির পরিমাণ রূপান্তর করুন। দৈর্ঘ্য-প্রস্থ দিয়ে ক্ষেত্রফল এবং জমির আনুমানিক মূল্যও হিসাব করুন—সম্পূর্ণ বিনামূল্যে।</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-emerald-950">
            <span className="rounded-full bg-lime-300 px-3 py-1.5">✓ বাংলা ভাষায়</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-white">✓ মোবাইল-ফ্রেন্ডলি</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-white">✓ তাৎক্ষণিক ফলাফল</span>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Land measurement calculator</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">আপনার জমির পরিমাণ লিখুন</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">হিসাবের ধরন বেছে নিয়ে তথ্য দিন। ফলাফল সঙ্গে সঙ্গে নিচে দেখা যাবে।</p>
        </div>
        <LandCalculatorClient />
        <div className="mt-8 rounded-2xl bg-emerald-900 p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
          <div><h2 className="text-lg font-black">আরও কৃষি হিসাবের প্রয়োজন?</h2><p className="mt-1 text-sm text-emerald-100">সার, বীজ ও চাষের খরচের জন্য AGRIVA-এর অন্যান্য ক্যালকুলেটর দেখুন।</p></div>
          <Link href="/agriculture-calculators" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-extrabold text-emerald-950 hover:bg-lime-200 sm:mt-0">কৃষি ক্যালকুলেটর দেখুন →</Link>
        </div>
      </div>
    </main>
  );
}
