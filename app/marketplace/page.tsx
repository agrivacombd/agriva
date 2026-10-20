import type { Metadata } from "next";
import MarketplaceCore from "@/components/marketplace/MarketplaceCore";

export const metadata: Metadata = {
  title: "কৃষি পণ্যের মার্কেটপ্লেস | AGRIVA বাংলাদেশ",
  description:
    "AGRIVA-তে কৃষি পণ্য আবিষ্কার করুন, কৃষক ও রিসেলারদের জন্য পণ্যের তালিকা ও কমিশন workflow দেখুন। পণ্যের live availability ও order status যাচাই করে নিন।",
  alternates: { canonical: "/marketplace" },
  keywords: [
    "কৃষি পণ্যের মার্কেটপ্লেস",
    "কৃষকের পণ্য বিক্রি",
    "কৃষি পণ্য বাংলাদেশ",
    "farmer marketplace Bangladesh",
    "agriculture marketplace",
    "reseller agriculture products",
  ],
  openGraph: {
    title: "AGRIVA Marketplace — কৃষি পণ্য এক জায়গায়",
    description:
      "কৃষক ও রিসেলারদের জন্য AGRIVA Marketplace-এর পণ্য তালিকা ও কমিশন workflow.",
    type: "website",
    locale: "bn_BD",
  },
};

export default function MarketplacePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f1] text-[#17351f]">
      <section className="relative isolate border-b border-emerald-950/10 bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-20">
          <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border-[48px] border-white/20" />
          <div className="absolute -bottom-28 left-[22%] h-72 w-72 rounded-full border-[36px] border-emerald-200/30" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-50">
              <span className="h-2 w-2 rounded-full bg-lime-300" />
              AGRIVA MARKETPLACE
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              কৃষি পণ্য কেনাবেচা হোক <span className="text-lime-300">আরও সহজ</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/85 sm:text-lg sm:leading-8">
              কৃষক ও রিসেলারদের জন্য পণ্য তালিকা, স্বচ্ছ কমিশন এবং রেফারেল workflow—একটি সহজ অভিজ্ঞতায়।
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#marketplace-workspace" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#17351f] shadow-lg shadow-black/10 transition hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#145b3c]">
                মার্কেটপ্লেস দেখুন <span aria-hidden="true" className="ml-2">↓</span>
              </a>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">
                কীভাবে কাজ করে
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-emerald-50/75 sm:text-sm">
              <span>✓ কৃষক-কেন্দ্রিক</span>
              <span>✓ কমিশন স্বচ্ছ রাখার লক্ষ্য</span>
              <span>✓ মোবাইল-ফ্রেন্ডলি</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-5">
              <div className="rounded-[1.5rem] bg-[#fbfdf8] p-5 text-[#17351f] sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Marketplace preview</p>
                    <h2 className="mt-2 text-xl font-black sm:text-2xl">আপনার কৃষি ব্যবসা, এক জায়গায়</h2>
                  </div>
                  <span className="rounded-2xl bg-emerald-100 p-3 text-2xl" aria-hidden="true">🌱</span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-emerald-950/10 bg-white p-4">
                    <span className="text-2xl" aria-hidden="true">🧑‍🌾</span>
                    <h3 className="mt-3 font-extrabold">কৃষক</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">পণ্য তালিকা ও কমিশন নির্ধারণ</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-950/10 bg-white p-4">
                    <span className="text-2xl" aria-hidden="true">🤝</span>
                    <h3 className="mt-3 font-extrabold">রিসেলার</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">রেফারেল workflow ও পণ্য প্রচার</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-lg text-white" aria-hidden="true">৳</span>
                  <div>
                    <p className="text-sm font-extrabold">মূল্য ও কমিশনে স্বচ্ছতা</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">লাইভ অর্ডার ও payout তথ্য backend-এ যাচাই করা প্রয়োজন।</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="marketplace-workspace" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">আপনার workspace</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">কৃষক ও রিসেলার প্যানেল</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">পণ্য তালিকা ও রেফারেল workflow দেখুন।</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Workflow preview
          </span>
        </div>
        <MarketplaceCore />
        <p className="mt-4 text-xs leading-5 text-slate-500">নোট: এই workspace-এর listing ও referral state বর্তমানে browser session-এ থাকে। বাস্তব বিক্রি, server-side referral attribution, order verification ও payout-এর জন্য production database/API সংযোগ যাচাই করতে হবে।</p>
      </section>

      <section id="how-it-works" className="border-t border-emerald-950/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">সহজ workflow</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">যেভাবে শুরু করবেন</h2>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              { n: "01", title: "পণ্য তালিকা করুন", desc: "পণ্যের নাম, বিক্রয়মূল্য এবং প্রযোজ্য কমিশন দিন।" },
              { n: "02", title: "রেফারেল তৈরি করুন", desc: "রিসেলার workflow থেকে পণ্য বেছে রেফারেল কোড তৈরি করুন।" },
              { n: "03", title: "অর্ডার যাচাই করুন", desc: "কমিশন payable হওয়ার আগে অর্ডার, বাতিল ও refund যাচাই করতে হবে।" },
            ].map((item) => (
              <article key={item.n} className="rounded-2xl border border-emerald-950/10 bg-[#fbfdf8] p-5 sm:p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-sm font-black text-white">{item.n}</span>
                <h3 className="mt-4 text-lg font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
