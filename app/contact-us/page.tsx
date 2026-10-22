import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "যোগাযোগ করুন | AGRIVA",
  description: "AGRIVA-র সেবা, কৃষিপণ্য বা ওয়েবসাইট ব্যবহার নিয়ে প্রশ্ন থাকলে ফোন, WhatsApp বা ইমেইলে যোগাযোগ করুন।",
  alternates: { canonical: "/contact-us" },
};

const phoneNumber = "01717504028";
const internationalPhoneNumber = "8801717504028";
const emailAddress = "Agriva.com.bd@gmail.com";
const whatsappMessage = encodeURIComponent("Hello AGRIVA, I would like to know more about your services.");

export default function ContactUsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-10 text-[#173629] sm:px-6 sm:py-16 lg:px-8">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm">
        <header className="bg-[#123f30] px-6 py-10 text-white sm:px-10 sm:py-12">
          <Link href="/" className="text-sm font-semibold text-emerald-100 transition hover:text-white">← AGRIVA হোম</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">আমরা সাহায্য করতে প্রস্তুত</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">যোগাযোগ করুন</h1>
          <p className="mt-5 max-w-2xl leading-8 text-emerald-50/90">AGRIVA-র কোনো ফিচার, কৃষিপণ্য, মার্কেটপ্লেস বা ওয়েবসাইট ব্যবহার নিয়ে প্রশ্ন আছে? নিচের সুবিধাজনক মাধ্যমটি বেছে নিয়ে আমাদের সঙ্গে যোগাযোগ করুন।</p>
        </header>
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-xl font-extrabold">যোগাযোগের মাধ্যম</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <a href={`tel:${phoneNumber}`} className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800" aria-hidden="true">☎</span>
              <h3 className="mt-4 font-extrabold">ফোন করুন</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">সরাসরি কল করতে নম্বরে চাপ দিন।</p>
              <span className="mt-4 inline-block font-bold text-emerald-800">{phoneNumber}</span>
            </a>
            <a href={`https://wa.me/${internationalPhoneNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800" aria-hidden="true">✉</span>
              <h3 className="mt-4 font-extrabold">WhatsApp</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">প্রস্তুত করা বার্তাসহ WhatsApp খুলুন। পাঠানোর আগে বার্তা সম্পাদনা করতে পারবেন।</p>
              <span className="mt-4 inline-block font-bold text-emerald-800">{phoneNumber}</span>
            </a>
            <a href={`mailto:${emailAddress}`} className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800" aria-hidden="true">@</span>
              <h3 className="mt-4 font-extrabold">ইমেইল</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">বিস্তারিত লিখে ইমেইল পাঠান।</p>
              <span className="mt-4 inline-block break-all font-bold text-emerald-800">{emailAddress}</span>
            </a>
          </div>
          <section className="mt-8 rounded-2xl bg-[#f8f8f1] p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">দ্রুত সহায়তা পেতে</h2>
            <p className="mt-3 leading-7 text-slate-600">আপনার প্রশ্নটি সংক্ষেপে ও পরিষ্কারভাবে লিখুন। অর্ডার বা কোনো নির্দিষ্ট ফিচার নিয়ে যোগাযোগ করলে প্রাসঙ্গিক অর্ডার নম্বর বা পেজের ঠিকানা দিতে পারেন। নিরাপত্তার স্বার্থে পাসওয়ার্ড, OTP বা সম্পূর্ণ পেমেন্ট কার্ডের তথ্য পাঠাবেন না।</p>
          </section>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/marketplace" className="rounded-xl border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50">মার্কেটপ্লেস দেখুন</Link>
            <Link href="/learn" className="rounded-xl border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50">কৃষি গাইড দেখুন</Link>
            <Link href="/privacy-policy" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">গোপনীয়তা নীতি</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
