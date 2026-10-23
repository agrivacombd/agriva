import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Coffee, HeartHandshake, Leaf, Sprout, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "এক কাপ কফি দিয়ে AGRIVA-কে সহায়তা করুন",
  description: "AGRIVA-র কৃষি টুলস ও শেখার রিসোর্স কাজে লাগলে স্বেচ্ছায় পাশে থাকুন। আপনার ছোট উপহারও প্ল্যাটফর্মটি উন্নত করতে সাহায্য করতে পারে।",
  alternates: { canonical: "/buy-me-a-coffee" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
    title: "কৃষির পাশে AGRIVA-র পাশে থাকুন",
    description: "AGRIVA-র কাজ আপনার উপকারে এলে স্বেচ্ছায় একটি কফি উপহার দিন।",
    url: "/buy-me-a-coffee",
  },
};

const coffeeUrl = process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL?.trim();

const ways = [
  {
    icon: Wrench,
    title: "টুলস আরও ভালো করা",
    text: "কৃষি ক্যালকুলেটর, পরিকল্পনা ও ডিজিটাল সুবিধাগুলো সহজ ও ব্যবহারবান্ধব করতে সহায়তা।",
  },
  {
    icon: Sprout,
    title: "বাংলায় কৃষি শেখা",
    text: "কৃষি শিক্ষার্থী, কৃষিবিদ ও চাষে আগ্রহীদের জন্য বাংলা শেখার রিসোর্স উন্নত করা।",
  },
  {
    icon: HeartHandshake,
    title: "সবার কাজে লাগে এমন প্ল্যাটফর্ম",
    text: "ব্যবহারকারীদের মতামত অনুযায়ী ভুল ঠিক করা, তথ্য হালনাগাদ ও নতুন সুবিধা তৈরির কাজে অবদান।",
  },
];

export default function BuyMeACoffeePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f0] text-[#173629]">
      <header className="border-b border-emerald-950/10 bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-black tracking-tight text-2xl text-emerald-900" aria-label="AGRIVA হোম">AGRIVA<span className="text-lime-700">.</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900 hover:underline"><ArrowLeft size={16} /> মূল সাইটে ফিরুন</Link>
        </div>
      </header>

      <section className="relative isolate">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-24 -top-16 h-80 w-80 rounded-full bg-lime-200/60 blur-3xl" />
          <div className="absolute -left-24 top-44 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-extrabold text-emerald-900"><Leaf size={15} /> কৃষির জন্য, মানুষের পাশে</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              AGRIVA আপনার কাজে লেগেছে?
              <span className="mt-2 block text-emerald-800">এক কাপ কফি দিয়ে পাশে থাকুন।</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              কৃষির কাজ প্রতিদিনই নতুন প্রশ্ন আনে—কীভাবে হিসাব করব, কোথায় তথ্য পাব, কোন বিষয়টা আরও ভালোভাবে শিখব? AGRIVA সেই কাজগুলো একটু সহজ করার চেষ্টা করছে, সহজ বাংলায় ও এক জায়গায়।
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700">
              আপনি যদি এখানে কোনো টুল, গাইড বা তথ্য থেকে উপকার পেয়ে থাকেন, স্বেচ্ছায় ছোট্ট একটি উপহার আমাদের এই কাজ চালিয়ে যেতে ও আরও ভালো করতে সাহায্য করতে পারে। <strong>এটি সম্পূর্ণ আপনার ইচ্ছা—উপহার না দিলেও AGRIVA ব্যবহার করতে পারবেন।</strong>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {coffeeUrl ? (
                <a href={coffeeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#0b6b4f] px-6 py-4 font-extrabold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#07543e]">
                  <Coffee size={20} /> এক কাপ কফি উপহার দিন <ArrowRight size={18} />
                </a>
              ) : (
                <Link href="/contact-us" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#0b6b4f] px-6 py-4 font-extrabold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#07543e]">
                  <Coffee size={20} /> সহায়তার উপায় জানতে যোগাযোগ করুন <ArrowRight size={18} />
                </Link>
              )}
              <Link href="/contact-us" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white/90 px-6 py-4 font-bold text-emerald-950 transition hover:bg-emerald-50">মতামত বা পরামর্শ দিন</Link>
            </div>
            {!coffeeUrl && <p className="mt-3 max-w-xl text-xs leading-5 text-slate-500">অনলাইন উপহার নেওয়ার লিংক এখনো কনফিগার করা হয়নি। আপাতত যোগাযোগ পেজ থেকে টিমের সঙ্গে কথা বলুন।</p>}
            <p className="mt-5 text-xs leading-5 text-slate-500">কোনো নির্দিষ্ট ফলন, আয় বা সেবার নিশ্চয়তার বিনিময়ে অনুদান চাওয়া হচ্ছে না। আপনার উপহার স্বেচ্ছামূলক।</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-200/70 via-lime-100/60 to-amber-100/70 blur-xl" />
            <div className="relative rounded-[2rem] border border-white bg-white p-6 shadow-2xl shadow-emerald-950/10 sm:p-8">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-800"><Coffee size={34} /></div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-700">A SMALL GIFT, A LITTLE MORE GROWTH</p>
              <h2 className="mt-3 text-2xl font-black leading-snug">আপনার ছোট্ট সমর্থন, আমাদের পরের ধাপের অনুপ্রেরণা।</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">এখানে আসার জন্য ধন্যবাদ। আপনার ব্যবহার, পরামর্শ ও সমর্থন—সবই AGRIVA-কে বাস্তব প্রয়োজন বুঝে এগোতে সাহায্য করে।</p>
              <div className="mt-6 rounded-2xl bg-[#f3f7ed] p-4">
                <p className="font-extrabold text-emerald-950">আপনি কীভাবে সাহায্য করতে পারেন?</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  <li>✓ আপনার কাজে লাগা টুলটি অন্য কৃষি-পেশাজীবীর সঙ্গে শেয়ার করুন</li>
                  <li>✓ ভুল বা পুরোনো তথ্য চোখে পড়লে জানান</li>
                  <li>✓ সামর্থ্য ও ইচ্ছা থাকলে একটি কফি উপহার দিন</li>
                </ul>
              </div>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500"><HeartHandshake size={20} className="shrink-0 text-emerald-700" /><span>কোনো চাপ নয়—আপনার আস্থা ও প্রতিক্রিয়াই গুরুত্বপূর্ণ।</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">SUPPORT THAT HELPS US GROW</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">আপনার উপহার কোন কাজে সহায়তা করতে পারে?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">সমর্থন পেলে AGRIVA-র উন্নয়নের কাজে সময় ও সম্পদ দেওয়া সহজ হয়। এগুলো আমাদের লক্ষ্য—কোনো নির্দিষ্ট খরচ বা ফলাফলের প্রতিশ্রুতি নয়।</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ways.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon size={23} /></span>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-[2rem] bg-[#123f30] p-7 text-white sm:p-10">
          <h2 className="text-2xl font-black sm:text-3xl">আপনার অভিজ্ঞতা আমাদের পরের উন্নতির দিশা</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/80">কোন টুলটি সবচেয়ে কাজে লেগেছে? কী যোগ হলে AGRIVA আপনার কাজ আরও সহজ করতে পারবে? আমাদের জানান—কারণ বাস্তব ব্যবহারকারীর অভিজ্ঞতাই উন্নতির সবচেয়ে ভালো সূত্রগুলোর একটি।</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact-us" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-emerald-950 transition hover:bg-emerald-50">মতামত জানান <ArrowRight size={17} /></Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 py-3 font-bold text-white transition hover:bg-white/10">AGRIVA ঘুরে দেখুন</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-950/10 bg-white px-4 py-6 text-center text-sm text-slate-500">
        <p>AGRIVA — কৃষির প্রতিটি ধাপে সহায়ক ডিজিটাল উদ্যোগ।</p>
        <Link href="/" className="mt-2 inline-block font-bold text-emerald-800 hover:underline">← AGRIVA-তে ফিরে যান</Link>
      </footer>
    </main>
  );
}
