import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = `${siteUrl}/green-living/low-light-indoor-plants-bangladesh`;

export const metadata: Metadata = {
  title: "কম আলোতে ভালো থাকা ১০টি Indoor Plant | বাংলাদেশ",
  description: "বাংলাদেশের বাসা ও অ্যাপার্টমেন্টে কম আলোতে রাখা যায় এমন ১০টি indoor plant, আলো বুঝে গাছ বাছাই, পানি ও যত্নের সহজ বাংলা গাইড।",
  alternates: { canonical: "/green-living/low-light-indoor-plants-bangladesh" },
  openGraph: {
    type: "article",
    locale: "bn_BD",
    url: pageUrl,
    title: "বাংলাদেশে কম আলোতে ভালো থাকা ১০টি Indoor Plant",
    description: "কম আলো পাওয়া ঘরেও গাছ রাখতে চাইলে কোন গাছ বেছে নেবেন? আলো, পানি ও যত্নসহ beginner-friendly guide.",
    siteName: "AGRIVA",
  },
};

const plants = [
  { name: "Snake Plant (Sansevieria)", light: "কম থেকে উজ্জ্বল পরোক্ষ আলো", care: "মাটি শুকালে পানি দিন; অতিরিক্ত পানি এড়িয়ে চলুন।", note: "শুরু করার জন্য সহজ; অন্ধকারে নয়, কিছু আলো প্রয়োজন।" },
  { name: "ZZ Plant (Zamioculcas)", light: "কম থেকে মাঝারি পরোক্ষ আলো", care: "মাটি বেশ শুকানোর পর পানি দিন।", note: "ধীরগতিতে বাড়ে; ঘন ঘন পানি পছন্দ করে না।" },
  { name: "Pothos / Money Plant", light: "কম থেকে উজ্জ্বল পরোক্ষ আলো", care: "মাটির উপরিভাগ শুকালে পানি দিন।", note: "লতা হিসেবে shelf বা hanging pot-এ রাখা যায়।" },
  { name: "Aglaonema", light: "মাঝারি থেকে কম পরোক্ষ আলো", care: "হালকা আর্দ্রতা বজায় রাখুন, জলাবদ্ধতা নয়।", note: "পাতার রঙ ও variety অনুযায়ী আলোর চাহিদা বদলাতে পারে।" },
  { name: "Peace Lily", light: "মাঝারি পরোক্ষ আলো", care: "মাটি শুকাতে শুরু করলে পানি দিন; drainage জরুরি।", note: "খুব কম আলোতে ফুল কম হতে পারে। পোষা প্রাণী/শিশু থাকলে নাগালের বাইরে রাখুন।" },
  { name: "Heartleaf Philodendron", light: "কম থেকে উজ্জ্বল পরোক্ষ আলো", care: "মাটির উপরিভাগ শুকানোর পর পানি দিন।", note: "লতানো গাছ; পাতার বৃদ্ধি আলো পেলে ভালো হয়।" },
  { name: "Cast Iron Plant", light: "কম থেকে মাঝারি আলো", care: "মাটি শুকানোর পর পানি দিন; ধীরে বাড়ে।", note: "কম আলো সহনশীলতার জন্য পরিচিত, তবে পুরো অন্ধকার নয়।" },
  { name: "Dracaena", light: "মাঝারি পরোক্ষ আলো; কিছু variety কম আলো সহ্য করে", care: "পানি দেওয়ার আগে মাটি পরীক্ষা করুন।", note: "সরাসরি কড়া রোদ ও জলাবদ্ধতা এড়িয়ে চলুন।" },
  { name: "Spider Plant", light: "মাঝারি থেকে উজ্জ্বল পরোক্ষ আলো", care: "মাটি কিছুটা শুকালে পানি দিন।", note: "খুব কম আলোতে বৃদ্ধি ধীর হতে পারে।" },
  { name: "Parlor Palm", light: "মাঝারি; কম আলো সহ্য করতে পারে", care: "হালকা আর্দ্রতা রাখুন, পানি জমাবেন না।", note: "ঘরের গাছ হিসেবে জনপ্রিয়; airflow ও পর্যবেক্ষণ উপকারী।" },
];

const faqs = [
  { question: "কম আলো বলতে কি জানালা ছাড়া ঘর বোঝায়?", answer: "না। কম আলো মানে সাধারণত জানালা থেকে দূরে বা সরাসরি রোদ না পাওয়া তুলনামূলক কম উজ্জ্বল জায়গা। একেবারে আলোহীন ঘরে কোনো গাছ দীর্ঘদিন ভালোভাবে বেড়ে উঠতে পারে না; প্রয়োজনে উপযুক্ত grow light ব্যবহার করতে হয়।" },
  { question: "বাংলাদেশে সবচেয়ে সহজ low-light indoor plant কোনটি?", answer: "Snake Plant, ZZ Plant ও Pothos অনেক beginner-এর জন্য তুলনামূলক সহজ পছন্দ। তবে ঘরের আলো, drainage ও পানি দেওয়ার অভ্যাস অনুযায়ী ফল ভিন্ন হতে পারে।" },
  { question: "কম আলোতে গাছে কি কম পানি দিতে হয়?", answer: "অনেক সময় কম আলোতে মাটি ধীরে শুকায়, তাই পানি দেওয়ার বিরতি বাড়তে পারে। কিন্তু নির্দিষ্ট schedule নয়—মাটির আর্দ্রতা পরীক্ষা করে পানি দিন।" },
  { question: "AC room-এ indoor plant রাখা যাবে?", answer: "রাখা যায়, তবে ঠান্ডা বাতাস সরাসরি গাছের ওপর না লাগানো, আলো পর্যাপ্ত রাখা এবং মাটি কত দ্রুত শুকাচ্ছে তা লক্ষ্য করা জরুরি।" },
  { question: "Low-light plant কি bathroom-এ রাখা যায়?", answer: "জানালা বা পর্যাপ্ত আলো থাকলে এবং বাতাস চলাচল করলে কিছু গাছ রাখা যায়। একেবারে অন্ধকার bathroom-এ গাছ রাখলে grow light বা নিয়মিত আলোকিত স্থানে নেওয়ার ব্যবস্থা প্রয়োজন।" },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "বাংলাদেশে কম আলোতে ভালো থাকা ১০টি Indoor Plant",
  description: "কম আলো পাওয়া ঘর ও অ্যাপার্টমেন্টে গাছ বাছাই, আলো বোঝা ও যত্নের beginner guide.",
  mainEntityOfPage: pageUrl,
  author: { "@type": "Organization", name: "AGRIVA" },
  publisher: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
  inLanguage: "bn-BD",
};
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function LowLightIndoorPlantsGuide() {
  return (
    <main className="min-h-screen bg-[#f6faf7] text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([articleJsonLd, faqJsonLd]).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-4xl px-4 pb-14 pt-5 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link href="/" className="font-semibold hover:text-emerald-800">AGRIVA</Link><span>/</span>
          <Link href="/green-living" className="font-semibold hover:text-emerald-800">Green Living</Link><span>/</span>
          <span aria-current="page" className="font-semibold text-emerald-900">Low-light Indoor Plants</span>
        </nav>
        <header className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-5 py-9 text-white sm:px-9 sm:py-12">
          <p className="text-xs font-black tracking-widest text-emerald-200">AGRIVA GREEN LIVING · INDOOR PLANTS</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">বাংলাদেশে কম আলোতে ভালো থাকা ১০টি Indoor Plant</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50">আপনার ঘরে সরাসরি রোদ কম আসে? সঠিক গাছ বেছে নিলে উজ্জ্বল পরোক্ষ আলো বা তুলনামূলক কম আলোতেও indoor garden শুরু করা যায়। এই গাইডে গাছ বাছাই, আলো বোঝা ও যত্নের সহজ নিয়ম পাবেন।</p>
          <p className="mt-4 text-sm text-emerald-100">শুরুর গাইড · বাংলাদেশি বাসা ও অ্যাপার্টমেন্ট</p>
        </header>

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7" aria-labelledby="quick-answer">
          <p className="text-xs font-black tracking-wider text-emerald-800">QUICK ANSWER</p>
          <h2 id="quick-answer" className="mt-2 text-xl font-black text-emerald-950">কম আলোতে কোন indoor plant ভালো?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">Snake Plant, ZZ Plant, Pothos, Aglaonema, Heartleaf Philodendron এবং Cast Iron Plant কম বা মাঝারি পরোক্ষ আলো পাওয়া ঘরের জন্য জনপ্রিয় পছন্দ। তবে “low light” মানে আলো ছাড়াই বাঁচবে নয়—জানালার আলো বা উপযুক্ত grow light দরকার। গাছের মাটি শুকানোর অবস্থা দেখে পানি দিন।</p>
        </section>

        <section className="mt-8" aria-labelledby="choose-light">
          <h2 id="choose-light" className="text-2xl font-black text-emerald-950 sm:text-3xl">আগে ঘরের আলো বুঝুন</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">বাংলাদেশের apartment-এ জানালার দিক, আশেপাশের ভবন, পর্দা এবং ঋতু অনুযায়ী আলো বদলায়। দিনের বিভিন্ন সময়ে আপনার জায়গাটি পর্যবেক্ষণ করুন।</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-emerald-100 bg-white p-4"><h3 className="font-extrabold text-emerald-950">উজ্জ্বল পরোক্ষ আলো</h3><p className="mt-2 text-sm leading-6 text-slate-600">জানালার কাছাকাছি উজ্জ্বলতা; গাছের পাতায় দীর্ঘ সময় সরাসরি কড়া রোদ পড়ে না।</p></article>
            <article className="rounded-xl border border-emerald-100 bg-white p-4"><h3 className="font-extrabold text-emerald-950">মাঝারি আলো</h3><p className="mt-2 text-sm leading-6 text-slate-600">জানালা থেকে কিছুটা দূরে বা filtered light; বৃদ্ধি তুলনামূলক ধীর হতে পারে।</p></article>
            <article className="rounded-xl border border-emerald-100 bg-white p-4"><h3 className="font-extrabold text-emerald-950">কম আলো</h3><p className="mt-2 text-sm leading-6 text-slate-600">আলো কম পৌঁছায়; low-light tolerant গাছ বেছে নিন, কিন্তু সম্পূর্ণ অন্ধকার এড়ান।</p></article>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="plant-list">
          <h2 id="plant-list" className="text-2xl font-black text-emerald-950 sm:text-3xl">কম আলো সহনশীল ১০টি indoor plant</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">গাছের variety, ঘরের পরিবেশ ও season অনুযায়ী care বদলাতে পারে। তালিকাটি নির্বাচন সহজ করার জন্য; সব গাছ একেবারে low-light জায়গায় একইভাবে বাড়বে না।</p>
          <div className="mt-4 space-y-3">
            {plants.map((plant, index) => (
              <article key={plant.name} className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-800 text-sm font-black text-white">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-extrabold text-emerald-950">{plant.name}</h3>
                    <p className="mt-2 text-sm leading-6"><strong>আলো:</strong> {plant.light}</p>
                    <p className="text-sm leading-6"><strong>পানি:</strong> {plant.care}</p>
                    <p className="text-sm leading-6 text-slate-600">{plant.note}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7" aria-labelledby="care-tips">
          <h2 id="care-tips" className="text-2xl font-black text-emerald-950">কম আলোতে indoor plant ভালো রাখার ৬টি নিয়ম</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>অন্ধকার কোণ নয়—যেখানে দিনের আলো পড়ছে এমন জায়গা বেছে নিন।</li>
            <li>পানি দেওয়ার আগে মাটি পরীক্ষা করুন; কম আলোতে মাটি ধীরে শুকাতে পারে।</li>
            <li>ড্রেনেজ ছিদ্রযুক্ত টব ব্যবহার করুন এবং টবে পানি জমিয়ে রাখবেন না।</li>
            <li>পাতা জানালার দিকে অস্বাভাবিক ঝুঁকলে বা বৃদ্ধি দুর্বল হলে আলোর অবস্থান পুনর্বিবেচনা করুন।</li>
            <li>AC বা ফ্যানের বাতাস সরাসরি পাতায় লাগতে দেবেন না।</li>
            <li>গাছ নতুন জায়গায় আনার পর কয়েক সপ্তাহ পর্যবেক্ষণ করুন; একসঙ্গে অনেক পরিবর্তন করবেন না।</li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="common-mistakes">
          <h2 id="common-mistakes" className="text-xl font-black text-amber-950">যে ভুলগুলো এড়িয়ে চলবেন</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-amber-950">
            <li>Low-light tolerant গাছ মানেই জানালা ছাড়া অন্ধকারে রাখা যাবে—এমন ধারণা।</li>
            <li>একই watering calendar সব গাছে প্রয়োগ করা।</li>
            <li>মাটি ভেজা থাকা অবস্থায় আবার পানি দেওয়া।</li>
            <li>সরাসরি কড়া রোদে হঠাৎ স্থানান্তর করা।</li>
            <li>পাতা হলুদ হলেই সার বা pesticide ব্যবহার করা।</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7" aria-labelledby="faq">
          <h2 id="faq" className="text-2xl font-black text-emerald-950">সাধারণ প্রশ্ন (FAQ)</h2>
          <div className="mt-4 divide-y divide-emerald-100">
            {faqs.map((faq) => <details key={faq.question} className="group py-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"><span>{faq.question}</span><span aria-hidden="true" className="text-xl text-emerald-800 transition group-open:rotate-45">+</span></summary><p className="pb-2 pt-3 text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-emerald-950 p-5 text-white sm:p-7">
          <h2 className="text-2xl font-black">এরপর কী পড়বেন?</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/green-living" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold hover:bg-white/10">Green Living-এর সব গাইড</Link>
            <Link href="/plant-market" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950">গাছ ও বাগানের পণ্য দেখুন</Link>
            <Link href="/garden" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold hover:bg-white/10">নিজের Garden তৈরি করুন</Link>
          </div>
        </section>
        <aside className="mt-8 text-sm leading-7 text-slate-600">এই লেখা সাধারণ plant-care তথ্য। গাছের প্রজাতি, ঘরের আলো, পানি ও পরিবেশ অনুযায়ী ফল ভিন্ন হতে পারে।</aside>
        <footer className="mt-8 border-t border-emerald-100 pt-5 text-sm text-slate-600"><Link href="/green-living" className="font-bold text-emerald-800 hover:underline">← Green Living-এ ফিরে যান</Link></footer>
      </div>
    </main>
  );
}
