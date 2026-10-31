import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SellerProductForm from "@/components/seller/SellerProductForm";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = siteUrl + "/seller/products/new";

export const metadata: Metadata = {
  title: "কৃষিপণ্য বিক্রি করুন | AGRIVA Seller Marketplace",
  description:
    "AGRIVA-তে আপনার ব্যবসার বীজ, সার, কৃষি উপকরণ ও প্যাকেটজাত পণ্য বিক্রির জন্য জমা দিন। পণ্যের ছবি, দাম, স্টক ও বিক্রয় একক যোগ করে ক্রেতাদের কাছে পৌঁছান।",
  alternates: { canonical: "/seller/products/new" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: pageUrl,
    siteName: "AGRIVA",
    title: "AGRIVA-তে কৃষিপণ্য বিক্রি করুন",
    description:
      "ব্যবসার কৃষিপণ্য Marketplace-এ তালিকাভুক্তির জন্য জমা দিন—ছবি, দাম, স্টক ও বিক্রয় এককসহ।",
  },
  twitter: {
    card: "summary",
    title: "AGRIVA-তে কৃষিপণ্য বিক্রি করুন",
    description: "আপনার ব্যবসার কৃষিপণ্য AGRIVA Marketplace-এ জমা দিন।",
  },
};

const faqs = [
  {
    question: "কারা AGRIVA Marketplace-এ পণ্য বিক্রি করতে পারবেন?",
    answer:
      "কৃষি উপকরণ, বীজ, সার, কৃষি যন্ত্রপাতি ও প্যাকেটজাত কৃষিপণ্যের কোম্পানি এবং অনুমোদিত ব্যবসায়িক বিক্রেতারা Seller বা Organization অ্যাকাউন্ট থেকে পণ্য জমা দিতে পারবেন।",
  },
  {
    question: "পণ্য জমা দিলেই কি Marketplace-এ দেখা যাবে?",
    answer:
      "না। জমা দেওয়া পণ্য প্রথমে অ্যাডমিন পর্যালোচনা করবে। অনুমোদনের পর পণ্যটি Marketplace-এ প্রকাশিত হবে।",
  },
  {
    question: "বিক্রয় একক কীভাবে নির্বাচন করব?",
    answer:
      "পণ্যের ধরন অনুযায়ী কেজি, গ্রাম, পিস, প্যাকেট, লিটার অথবা বস্তা নির্বাচন করুন। মূল্য হবে প্রতি নির্বাচিত এককের দাম এবং স্টক হবে সেই এককের মোট পরিমাণ।",
  },
  {
    question: "পণ্যের ছবি দেওয়া কি বাধ্যতামূলক?",
    answer:
      "ছবি ঐচ্ছিক, তবে পরিষ্কার ও বাস্তব পণ্যের ছবি দিলে ক্রেতারা পণ্যটি বুঝতে সুবিধা পান। JPG, PNG বা WebP ফরম্যাটে সর্বোচ্চ ৫ MB ছবি যোগ করা যায়।",
  },
];

const sellerLandingJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AGRIVA-তে কৃষিপণ্য বিক্রি করুন",
  url: pageUrl,
  description:
    "ব্যবসার কৃষিপণ্য AGRIVA Marketplace-এ তালিকাভুক্তির জন্য জমা দেওয়ার নির্দেশনা ও ফর্ম।",
  inLanguage: "bn-BD",
  isPartOf: { "@type": "WebSite", name: "AGRIVA", url: siteUrl },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  },
};

export default async function NewSellerProductPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canSubmit = false;
  if (user) {
    const { data: membership } = await supabase
      .from("marketplace_seller_permissions")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    canSubmit = Boolean(membership);
  }

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sellerLandingJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <section className="relative overflow-hidden bg-[#103d2a] px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[48px] border-lime-300/10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <Link href="/marketplace" className="text-sm font-bold text-lime-200 hover:text-white">
              ← AGRIVA Marketplace
            </Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-lime-300">
              AGRIVA SELLER MARKETPLACE
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              আপনার কৃষিপণ্য পৌঁছে দিন আরও বেশি ক্রেতার কাছে
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/85 sm:text-lg">
              বীজ, সার, কৃষি উপকরণ, যন্ত্রপাতি ও প্যাকেটজাত পণ্যের তথ্য এক জায়গায় জমা দিন।
              যাচাই ও অনুমোদনের পর আপনার পণ্য AGRIVA Marketplace-এ প্রদর্শিত হবে।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#product-submission" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-6 py-3 font-extrabold text-[#17351f] shadow-lg shadow-black/10 transition hover:bg-lime-200">
                পণ্য জমা দিন <span aria-hidden="true" className="ml-2">↓</span>
              </a>
              <Link href="/marketplace" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 py-3 font-bold text-white transition hover:bg-white/10">
                Marketplace ঘুরে দেখুন
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-emerald-100">
              <span>✓ ব্যবসায়িক বিক্রেতাদের জন্য</span>
              <span>✓ পণ্য যাচাইয়ের ব্যবস্থা</span>
              <span>✓ এককভিত্তিক মূল্য ও স্টক</span>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/15 bg-white/[.08] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-lime-300">SELLER CHECKLIST</p>
            <h2 className="mt-3 text-2xl font-black">পণ্য জমা দিতে যা লাগবে</h2>
            <div className="mt-6 space-y-4">
              {[
                ["01", "পণ্যের নাম ও ক্যাটাগরি", "ক্রেতারা যে নামে পণ্যটি চেনেন, সেই নাম লিখুন।"],
                ["02", "বিক্রয় একক ও মূল্য", "কেজি, গ্রাম, পিস, প্যাকেট, লিটার বা বস্তা বেছে নিন।"],
                ["03", "স্টকের পরিমাণ", "নির্বাচিত একক অনুযায়ী মোট মজুত লিখুন।"],
                ["04", "পণ্যের ছবি", "ঐচ্ছিক—তবে পরিষ্কার ছবি ক্রেতার আস্থা বাড়ায়।"],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-300/15 text-sm font-black text-lime-300">{number}</span>
                  <div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-emerald-50/70">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3">
        {[
          ["আপনার পণ্য জমা দিন", "নাম, ক্যাটাগরি, ছবি, দাম, স্টক ও বিক্রয় একক দিয়ে ফর্ম পূরণ করুন."],
          ["AGRIVA যাচাই করবে", "জমা দেওয়া তথ্য ও পণ্য অ্যাডমিন পর্যালোচনা করবে। প্রয়োজনে তথ্য সংশোধনের অনুরোধ আসতে পারে।"],
          ["অনুমোদনের পর প্রকাশ", "অনুমোদিত পণ্য Marketplace-এ দেখা যাবে, যেখানে ক্রেতারা পণ্যের তথ্য ও মূল্য দেখতে পারবেন।"],
        ].map(([title, description], index) => (
          <article key={title} className="rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-sm">
            <span className="text-sm font-black text-emerald-700">{"০" + (index + 1).toLocaleString("bn-BD")}</span>
            <h2 className="mt-3 text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-[#637467]">{description.replace(/\.$/, "।")}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid gap-8 rounded-3xl bg-[#eaf2e4] p-6 sm:p-9 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-800">CLEAR PRODUCT INFORMATION</p>
            <h2 className="mt-3 text-3xl font-black">দাম ও স্টক—একক অনুযায়ী স্পষ্টভাবে দিন</h2>
            <p className="mt-4 text-sm leading-7 text-[#526756]">
              ক্রেতাকে বিভ্রান্তি থেকে বাঁচাতে প্রতি এককের দাম এবং সেই এককে মোট স্টক লিখুন।
              উদাহরণ: প্রতি কেজি ৫০০ টাকা, স্টক ১০০ কেজি।
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {["কেজি (kg)", "গ্রাম (g)", "পিস (piece)", "প্যাকেট (pack)", "লিটার (liter)", "বস্তা (bag)"].map((unit) => (
                <span key={unit} className="rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm font-bold text-emerald-950">{unit}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-black">একটি ভালো পণ্য তালিকায় রাখুন</h3>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#526756]">
              <li>✓ সঠিক ও পরিচিত পণ্যের নাম</li>
              <li>✓ উপযুক্ত ক্যাটাগরি ও সাব-ক্যাটাগরি</li>
              <li>✓ বাস্তব বিক্রয় একক, প্রতি এককের মূল্য ও স্টক</li>
              <li>✓ পণ্যের পরিষ্কার, সাম্প্রতিক ছবি (ঐচ্ছিক)</li>
              <li>✓ সংক্ষিপ্ত ও নির্ভুল পণ্যের বিবরণ</li>
            </ul>
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              নোট: পণ্য জমা দিলেই তা প্রকাশিত হয় না। অ্যাডমিন অনুমোদনের পরই তালিকাটি পাবলিক Marketplace-এ দেখাবে।
            </p>
          </div>
        </div>
      </section>

      <section id="product-submission" className="scroll-mt-24 bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">PRODUCT SUBMISSION</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">আপনার ব্যবসার পণ্য জমা দিন</h2>
            <p className="mt-3 leading-7 text-[#637467]">ফর্ম পূরণ করে পণ্যটি AGRIVA টিমের পর্যালোচনার জন্য পাঠান।</p>
          </div>
          {canSubmit ? (
            <div className="mx-auto mt-8 max-w-3xl"><SellerProductForm /></div>
          ) : (
            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-emerald-900/10 bg-[#f5f8f1] p-7 text-center sm:p-10">
              <h3 className="text-2xl font-black">বিক্রেতা অ্যাকাউন্ট দিয়ে শুরু করুন</h3>
              <p className="mt-3 text-sm leading-7 text-[#637467]">
                Marketplace-এ পণ্য যোগ করতে আগে আলাদাভাবে Seller আবেদন করুন। অ্যাডমিন অনুমোদন না দেওয়া পর্যন্ত Product Submission চালু হবে না।
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/login?next=/seller/products/new" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-900 px-6 py-3 font-extrabold text-white hover:bg-emerald-800">লগইন করুন</Link>
                <Link href="/sell-on-marketplace" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-900/20 bg-white px-6 py-3 font-extrabold text-emerald-950 hover:bg-emerald-50">Marketplace Seller আবেদন করুন</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-center text-xs font-black uppercase tracking-[.18em] text-emerald-700">FAQ</p>
        <h2 className="mt-3 text-center text-3xl font-black">বিক্রেতাদের সাধারণ প্রশ্ন</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-emerald-950/10 bg-white p-5 open:bg-[#f5f8f1]">
              <summary className="cursor-pointer list-none pr-8 font-extrabold marker:hidden">
                {faq.question}
                <span aria-hidden="true" className="float-right text-emerald-800 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-[#637467]">{faq.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/marketplace" className="font-bold text-emerald-800 underline underline-offset-4">AGRIVA Marketplace-এ পণ্য দেখুন</Link>
        </div>
      </section>
    </main>
  );
}
