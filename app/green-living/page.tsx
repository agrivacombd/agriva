import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = `${siteUrl}/green-living`;

export const metadata: Metadata = {
  title: "Green Living: ইনডোর প্ল্যান্ট ও ছাদবাগানের বাংলা গাইড",
  description:
    "বাংলাদেশের ইনডোর প্ল্যান্ট, ছাদবাগান, বারান্দার গাছ ও শখের বাগানপ্রেমীদের জন্য সহজ বাংলা গাইড, গাছের যত্নের পরিকল্পনা এবং ব্যবহারিক টিপস।",
  alternates: { canonical: "/green-living" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: pageUrl,
    title: "AGRIVA Green Living | আপনার সবুজ জগত",
    description:
      "ইনডোর প্ল্যান্ট, ছাদবাগান ও শখের বাগানের যত্ন শিখুন—সহজ বাংলায়, বাংলাদেশি আবহাওয়ার কথা মাথায় রেখে।",
    siteName: "AGRIVA",
  },
  twitter: {
    card: "summary",
    title: "AGRIVA Green Living | আপনার সবুজ জগত",
    description: "ইনডোর প্ল্যান্ট ও ছাদবাগানের সহজ বাংলা গাইড।",
  },
};

const guides = [
  {
    icon: "🪴",
    category: "ইনডোর প্ল্যান্ট",
    title: "ঘরের ভেতর গাছ রাখার আগে যে বিষয়গুলো দেখবেন",
    description:
      "জানালার আলো, বাতাস চলাচল, টবের ড্রেনেজ ও গাছের জায়গা বুঝে ইনডোর প্ল্যান্ট বেছে নেওয়ার প্রাথমিক নির্দেশনা।",
    points: ["পরোক্ষ আলো কতটা আসে দেখুন", "ড্রেনেজ ছিদ্রযুক্ত টব বেছে নিন", "পাতা ও মাটির অবস্থা নিয়মিত দেখুন"],
  },
  {
    icon: "🌿",
    category: "ছাদ ও বারান্দা",
    title: "ছোট জায়গায় বাগান শুরু করার সহজ পরিকল্পনা",
    description:
      "ছাদ বা বারান্দার জায়গা, রোদ, বাতাস এবং গাছের ওজন বিবেচনা করে ছোট বাগানের পরিকল্পনা করুন।",
    points: ["দিনে কতক্ষণ রোদ পড়ে লক্ষ্য করুন", "ভারী টব রাখার আগে ছাদের নিরাপত্তা বিবেচনা করুন", "একসঙ্গে অল্প কয়েকটি গাছ দিয়ে শুরু করুন"],
  },
  {
    icon: "💧",
    category: "গাছের যত্ন",
    title: "গাছে পানি দেওয়ার একটাই নিয়ম সবার জন্য নয়",
    description:
      "গাছের প্রজাতি, টবের আকার, মাটির মিশ্রণ, আলো ও আবহাওয়া অনুযায়ী পানির প্রয়োজন বদলায়।",
    points: ["পানি দেওয়ার আগে মাটির আর্দ্রতা দেখুন", "টবে অতিরিক্ত পানি জমতে দেবেন না", "একই ক্যালেন্ডার সব গাছে প্রয়োগ করবেন না"],
  },
  {
    icon: "🌱",
    category: "মাটি ও টব",
    title: "টবের মাটি ও ড্রেনেজ কেন গুরুত্বপূর্ণ",
    description:
      "শিকড়ের জন্য বাতাস চলাচল, পানি বের হওয়ার ব্যবস্থা এবং গাছ অনুযায়ী উপযুক্ত growing medium বেছে নিন।",
    points: ["বাগানের ভারী মাটি সরাসরি সব টবে ব্যবহার করবেন না", "গাছের ধরন অনুযায়ী মিশ্রণ বাছুন", "নতুন মাটি ব্যবহারের আগে মান ও পরিচ্ছন্নতা যাচাই করুন"],
  },
  {
    icon: "🐛",
    category: "সমস্যা শনাক্ত",
    title: "পাতা হলুদ হলে প্রথমে কী পরীক্ষা করবেন",
    description:
      "পাতা হলুদ হওয়ার কারণ অতিরিক্ত পানি, কম আলো, পুষ্টির সমস্যা বা পোকাসহ বিভিন্ন বিষয় হতে পারে। লক্ষণ দেখে একা নিশ্চিত সিদ্ধান্ত নেবেন না।",
    points: ["মাটির ভেজাভাব ও ড্রেনেজ পরীক্ষা করুন", "পাতার দুই পাশ ও কাণ্ডে পোকা দেখুন", "একসঙ্গে অনেক সার বা রাসায়নিক প্রয়োগ করবেন না"],
  },
  {
    icon: "📷",
    category: "গাছের অগ্রগতি",
    title: "ছবি দিয়ে গাছের বেড়ে ওঠা নথিবদ্ধ করুন",
    description:
      "একই আলো ও কোণ থেকে নিয়মিত ছবি তুলে পাতার নতুন বৃদ্ধি, রিপটিং এবং যত্নের পরিবর্তন পর্যবেক্ষণ করুন।",
    points: ["ছবির সঙ্গে তারিখ লিখুন", "পানি, সার ও টব বদলের নোট রাখুন", "সমস্যা দেখা দিলে আগের ছবির সঙ্গে তুলনা করুন"],
  },
];

const faqs = [
  {
    question: "ইনডোর প্ল্যান্টের যত্ন কীভাবে শুরু করব?",
    answer:
      "প্রথমে গাছের নাম, ঘরের আলো, টবের ড্রেনেজ এবং মাটির আর্দ্রতা বুঝুন। নির্দিষ্ট গাছের প্রয়োজন অনুযায়ী যত্নের নিয়ম ঠিক করুন।",
  },
  {
    question: "সব গাছে কি নির্দিষ্ট দিন পরপর পানি দিতে হয়?",
    answer:
      "না। গাছের প্রজাতি, টব, মাটি, তাপমাত্রা ও আলো অনুযায়ী পানির প্রয়োজন বদলায়। ক্যালেন্ডারকে স্মরণ করিয়ে দেওয়ার উপায় হিসেবে নিন, মাটি পরীক্ষা করার বিকল্প হিসেবে নয়।",
  },
  {
    question: "ছাদবাগান শুরু করার আগে কী বিবেচনা করা জরুরি?",
    answer:
      "সূর্যালোক, বাতাস, পানি নিষ্কাশন, নিরাপদ চলাচল এবং ভেজা মাটি ও টবের ওজন বিবেচনা করুন। কাঠামোগত নিরাপত্তা নিয়ে সন্দেহ থাকলে বিশেষজ্ঞের পরামর্শ নিন।",
  },
  {
    question: "পাতা হলুদ হলে কি সার দেওয়া উচিত?",
    answer:
      "অবশ্যই নয়। অতিরিক্ত পানি, শিকড়ের সমস্যা, আলো বা পোকাও কারণ হতে পারে। আগে লক্ষণ ও মাটির অবস্থা পরীক্ষা করুন; কারণ না বুঝে অতিরিক্ত সার দেবেন না।",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function GreenLivingPage() {
  return (
    <main className="min-h-screen bg-[#f6faf7] text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link href="/" className="font-semibold hover:text-emerald-800">AGRIVA</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-emerald-900">Green Living</span>
        </nav>

        <header className="relative mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-5 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[32px] border-white/10 sm:h-80 sm:w-80" />
          <p className="relative text-sm font-bold tracking-wide text-emerald-200">AGRIVA · GREEN LIVING</p>
          <h1 className="relative mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
            আপনার ঘর, ছাদ আর বারান্দায় আরও একটু সবুজ
          </h1>
          <p className="relative mt-5 max-w-2xl text-base leading-8 text-emerald-50 sm:text-lg">
            ইনডোর প্ল্যান্ট, ছাদবাগান ও শখের গাছের যত্ন নিয়ে সহজ বাংলা গাইড। ছোট জায়গা থেকে শুরু করুন, নিজের গাছকে বুঝুন, আর ধীরে ধীরে গড়ে তুলুন আপনার সবুজ জগৎ।
          </p>
          <div className="relative mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#garden-guides" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
              গাছের যত্নের গাইড দেখুন
            </a>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
              AGRIVA-তে সাইন ইন
            </Link>
          </div>
          <p className="relative mt-4 text-xs leading-6 text-emerald-100">বাংলাদেশের গরম, বর্ষা, আলো ও ছোট জায়গার বাস্তবতা মাথায় রেখে শেখার জন্য তৈরি।</p>
        </header>

        <section aria-labelledby="green-living-tools" className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm"><p className="text-2xl" aria-hidden="true">🪴</p><h2 className="mt-3 font-extrabold text-emerald-950">নিজের Garden গড়ুন</h2><p className="mt-2 text-sm leading-6 text-slate-600">নিজের গাছের তালিকা ও care task এক জায়গায় রাখুন।</p><Link href="/garden" className="mt-4 inline-flex min-h-10 items-center font-bold text-emerald-800 underline underline-offset-4">Personal Garden খুলুন</Link></article>
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm"><p className="text-2xl" aria-hidden="true">🌱</p><h2 className="mt-3 font-extrabold text-emerald-950">গাছ বিনিময় করুন</h2><p className="mt-2 text-sm leading-6 text-slate-600">চারা, কাটিং বা গাছ ভাগ করে স্থানীয় বাগানিদের সঙ্গে যুক্ত হোন।</p><Link href="/green-exchange/board" className="mt-4 inline-flex min-h-10 items-center font-bold text-emerald-800 underline underline-offset-4">Exchange board দেখুন</Link></article>
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm"><p className="text-2xl" aria-hidden="true">🌍</p><h2 className="mt-3 font-extrabold text-emerald-950">কমিউনিটির অগ্রগতি</h2><p className="mt-2 text-sm leading-6 text-slate-600">বাস্তব platform activity থেকে Green Impact metrics দেখুন।</p><Link href="/impact" className="mt-4 inline-flex min-h-10 items-center font-bold text-emerald-800 underline underline-offset-4">Impact dashboard</Link></article>
        </section>

        <section aria-labelledby="why-green-living" className="mt-10">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">শখ থেকে অভ্যাস</p>
            <h2 id="why-green-living" className="mt-2 text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">বাগান করা হোক সহজ, আনন্দের ও ধারাবাহিক</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">প্রথম গাছ কেনা থেকে যত্নের ভুল বুঝতে পারা—ধাপে ধাপে শিখুন। সব গাছের জন্য এক নিয়ম নয়; আপনার গাছ, জায়গা ও পরিবেশ বুঝে সিদ্ধান্ত নিন।</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { icon: "🧭", title: "সহজ নির্দেশনা", text: "প্রথমবার বাগান শুরু করলেও ছোট ছোট ধাপে এগোন।" },
              { icon: "☀️", title: "জায়গা বুঝে যত্ন", text: "আলো, বাতাস, টব ও মাটির অবস্থা বিবেচনা করুন।" },
              { icon: "📔", title: "নিজের অভিজ্ঞতা", text: "ছবি ও নোট রেখে কী কাজ করছে তা বুঝে নিন।" },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <span aria-hidden="true" className="text-3xl">{item.icon}</span>
                <h3 className="mt-3 text-lg font-extrabold text-emerald-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="garden-guides" aria-labelledby="garden-guides-title" className="mt-12 scroll-mt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">বাংলা গাইড</p>
              <h2 id="garden-guides-title" className="mt-2 text-2xl font-black text-emerald-950 sm:text-3xl">গাছের যত্ন শিখুন</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">শুরু করার জন্য প্রয়োজনীয় বিষয়গুলো এক জায়গায়।</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-2xl">{guide.icon}</span>
                  <p className="text-xs font-bold text-emerald-800">{guide.category}</p>
                </div>
                <h3 className="mt-4 text-lg font-extrabold leading-7 text-slate-900">{guide.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{guide.description}</p>
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-700">
                  {guide.points.map((point) => <li key={point} className="flex gap-2"><span aria-hidden="true" className="font-bold text-emerald-700">✓</span><span>{point}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="habit-title" className="mt-12 rounded-3xl border border-emerald-100 bg-white p-6 sm:p-9">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">ধারাবাহিক যত্ন</p>
            <h2 id="habit-title" className="mt-2 text-2xl font-black text-emerald-950 sm:text-3xl">প্রতিদিন সব গাছে পানি নয়—প্রতিদিন একটু পর্যবেক্ষণ</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">গাছের যত্নে নির্দিষ্ট রুটিন কাজে লাগে, কিন্তু পানি বা সার দেওয়ার সিদ্ধান্ত গাছের বাস্তব অবস্থা দেখে নিন। পাতার রং, মাটির আর্দ্রতা, নতুন বৃদ্ধি ও পোকামাকড় লক্ষ্য করলে সমস্যা আগে ধরতে সুবিধা হয়।</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["১", "দেখুন", "পাতা, কাণ্ড, মাটি ও টবের ড্রেনেজ পর্যবেক্ষণ করুন।"],
              ["২", "বুঝুন", "গাছের ধরন, আলো ও সাম্প্রতিক আবহাওয়ার কথা ভাবুন।"],
              ["৩", "কাজ করুন", "প্রয়োজন অনুযায়ী পানি, অবস্থান বা যত্নে পরিবর্তন আনুন।"],
              ["৪", "নোট রাখুন", "তারিখসহ ছবি বা ছোট নোট লিখে ফলাফল দেখুন।"],
            ].map(([number, title, text]) => (
              <div key={number} className="flex gap-3 rounded-xl bg-[#f6faf7] p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-800 text-sm font-black text-white">{number}</span>
                <div><h3 className="font-extrabold text-emerald-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mt-12">
          <h2 id="faq-title" className="text-2xl font-black text-emerald-950 sm:text-3xl">বাগান নিয়ে সাধারণ প্রশ্ন</h2>
          <div className="mt-5 divide-y divide-emerald-100 rounded-2xl border border-emerald-100 bg-white px-5">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span aria-hidden="true" className="text-xl text-emerald-800 transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-4xl pb-2 pt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <aside className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          <strong>মনে রাখুন:</strong> এই গাইডগুলো প্রাথমিক শিক্ষামূলক তথ্য। গাছের প্রজাতি, স্থানীয় পরিবেশ ও সমস্যার ধরন অনুযায়ী যত্ন বদলাতে পারে। রোগ বা পোকা নিশ্চিত না হয়ে কীটনাশক প্রয়োগ করবেন না; পণ্যের লেবেল ও স্থানীয় বিশেষজ্ঞের পরামর্শ অনুসরণ করুন।
        </aside>

        <footer className="mt-10 flex flex-col gap-3 border-t border-emerald-100 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>AGRIVA Green Living · শখের বাগানের বাংলা সহায়ক কেন্দ্র</p>
          <Link href="/" className="font-bold text-emerald-800 hover:underline">AGRIVA হোমে ফিরুন →</Link>
        </footer>
      </div>
    </main>
  );
}
