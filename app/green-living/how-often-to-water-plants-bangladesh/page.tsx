import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = `${siteUrl}/green-living/how-often-to-water-plants-bangladesh`;

export const metadata: Metadata = {
  title: "গাছে কতদিন পর পানি দেবেন? বাংলাদেশে Plant Watering Guide",
  description: "বাংলাদেশের গরম, বর্ষা ও শীতকালে indoor, rooftop ও balcony গাছে কখন পানি দেবেন জানুন। Soil check, overwatering signs ও সহজ watering chart.",
  alternates: { canonical: "/green-living/how-often-to-water-plants-bangladesh" },
  openGraph: {
    type: "article",
    locale: "bn_BD",
    url: pageUrl,
    title: "বাংলাদেশে গাছে কতদিন পর পানি দেবেন? সহজ Watering Guide",
    description: "মৌসুম, গাছ, টব ও মাটির আর্দ্রতা বুঝে পানি দেওয়ার নিয়ম—বাংলাদেশি plant owner-এর practical guide.",
    siteName: "AGRIVA",
  },
};

const faqs = [
  { question: "গাছে কি প্রতিদিন পানি দিতে হয়?", answer: "না। সব গাছে প্রতিদিন পানি লাগে না। গাছের প্রজাতি, টবের আকার, মাটি, আলো, বাতাস ও আবহাওয়ার উপর নির্ভর করে মাটি কত দ্রুত শুকায়। পানি দেওয়ার আগে মাটির আর্দ্রতা পরীক্ষা করুন।" },
  { question: "গাছে পানি দেওয়ার সবচেয়ে ভালো সময় কোনটি?", answer: "সাধারণত সকালে পানি দিলে দিনের মধ্যে পাতায় বা মাটির উপর অতিরিক্ত আর্দ্রতা কমতে পারে এবং গাছ পানি ব্যবহার করতে পারে। তবে indoor গাছে সময়ের চেয়ে মাটি শুকানোর অবস্থা ও সঠিকভাবে পানি দেওয়া বেশি গুরুত্বপূর্ণ।" },
  { question: "বর্ষাকালে indoor plant-এ কত পানি দেব?", answer: "বর্ষায় আর্দ্রতা বেশি থাকলে মাটি ধীরে শুকাতে পারে। আগের মতো নির্দিষ্ট schedule অনুসরণ না করে মাটি পরীক্ষা করে পানি দিন এবং drainage hole খোলা রাখুন।" },
  { question: "Overwatering-এর লক্ষণ কী?", answer: "মাটি দীর্ঘসময় ভেজা থাকা, হলুদ পাতা, নরম stem, দুর্গন্ধ বা শিকড়ের পচন overwatering বা drainage সমস্যার লক্ষণ হতে পারে। শুধু পাতার হলুদ হওয়া দেখে নিশ্চিত সিদ্ধান্ত নেবেন না; আলো, পোকা ও অন্যান্য কারণও পরীক্ষা করুন।" },
  { question: "টবের নিচ দিয়ে পানি বের হওয়া কি জরুরি?", answer: "বেশিরভাগ container plant-এর জন্য drainage hole উপকারী, কারণ অতিরিক্ত পানি বেরিয়ে যেতে পারে। পানি বের হলে saucer বা outer pot-এ জমে থাকা পানি ফেলে দিন।" },
  { question: "ছাদের গাছে গরমে কতবার পানি দিতে হবে?", answer: "ছাদের টব রোদ, বাতাস ও ছোট pot-এর কারণে দ্রুত শুকাতে পারে; কোনো কোনো দিনে মাটি একাধিকবার পরীক্ষা করতে হতে পারে। তবে প্রতিদিন বা দিনে দুইবার পানি দেওয়ার fixed rule নয়—মাটির অবস্থা দেখে সিদ্ধান্ত নিন।" },
];

const plantGroups = [
  { plant: "Snake Plant / ZZ Plant", check: "মাটি অনেকটা শুকিয়েছে কি না দেখুন", advice: "সাধারণত পানি দেওয়ার মাঝে বেশি বিরতি লাগে; ভেজা মাটিতে বারবার পানি দেবেন না।" },
  { plant: "Pothos / Philodendron", check: "উপরের মাটি শুকনো এবং pot হালকা হয়েছে কি না", advice: "মাটি কিছুটা শুকানোর পর ভালোভাবে পানি দিন; জলাবদ্ধতা এড়ান।" },
  { plant: "Peace Lily", check: "উপরের স্তর শুকাতে শুরু করেছে কি না", advice: "খুব বেশি শুকিয়ে দীর্ঘসময় ফেলে না রেখে আর্দ্রতা দেখুন; drainage ঠিক রাখুন।" },
  { plant: "Herbs / leafy vegetables", check: "টবের মাটি দ্রুত শুকাচ্ছে কি না", advice: "বৃদ্ধি ও গরমে তুলনামূলক বেশি moisture লাগতে পারে; পানি জমতে দেবেন না।" },
  { plant: "Succulents / cactus", check: "মাটি pot-এর গভীরে শুকিয়েছে কি না", advice: "সম্পূর্ণ শুকানোর পর পানি দিন; দীর্ঘসময় ভেজা মাটি এদের জন্য ঝুঁকিপূর্ণ।" },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "বাংলাদেশে গাছে কতদিন পর পানি দেবেন? Plant Watering Guide",
  description: "বাংলাদেশের ঋতু ও গাছের ধরন অনুযায়ী মাটি পরীক্ষা করে পানি দেওয়ার practical guide.",
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

export default function WateringPlantsBangladeshGuide() {
  return (
    <main className="min-h-screen bg-[#f6faf7] text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([articleJsonLd, faqJsonLd]).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-4xl px-4 pb-14 pt-5 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link href="/" className="font-semibold hover:text-emerald-800">AGRIVA</Link><span>/</span>
          <Link href="/green-living" className="font-semibold hover:text-emerald-800">Green Living</Link><span>/</span>
          <span aria-current="page" className="font-semibold text-emerald-900">Plant Watering Guide</span>
        </nav>
        <header className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-5 py-9 text-white sm:px-9 sm:py-12">
          <p className="text-xs font-black tracking-widest text-emerald-200">AGRIVA GREEN LIVING · PLANT CARE</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">বাংলাদেশে গাছে কতদিন পর পানি দেবেন?</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50">গরম, বর্ষা কিংবা শীত—গাছে পানি দেওয়ার একটাই fixed schedule নেই। গাছের ধরন, টব, মাটি ও আবহাওয়া বুঝে কখন পানি প্রয়োজন তা সহজে নির্ধারণ করুন।</p>
          <p className="mt-4 text-sm text-emerald-100">Indoor · Rooftop · Balcony · Beginner friendly</p>
        </header>

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7" aria-labelledby="quick-answer">
          <p className="text-xs font-black tracking-wider text-emerald-800">QUICK ANSWER</p>
          <h2 id="quick-answer" className="mt-2 text-xl font-black text-emerald-950">কখন গাছে পানি দেবেন?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">পানি দেওয়ার আগে আঙুল দিয়ে মাটির উপরিভাগ থেকে ২–৩ সেমি পরীক্ষা করুন। এই স্তর শুকনো হলে এবং গাছের ধরন অনুযায়ী পানি প্রয়োজন হলে ধীরে ধীরে পানি দিন, যেন root zone ভিজে এবং অতিরিক্ত পানি drainage দিয়ে বের হয়। Succulent, cactus ও moisture-loving গাছের নিয়ম আলাদা। প্রতিদিন পানি দেওয়ার calendar নয়—মাটির অবস্থা দেখে সিদ্ধান্ত নিন।</p>
        </section>

        <section className="mt-8" aria-labelledby="soil-test">
          <h2 id="soil-test" className="text-2xl font-black text-emerald-950 sm:text-3xl">৩ ধাপে Soil Check করুন</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-emerald-100 bg-white p-4"><h3 className="font-extrabold text-emerald-950">১. আঙুল দিয়ে পরীক্ষা</h3><p className="mt-2 text-sm leading-6 text-slate-600">মাটির উপরিভাগ থেকে ২–৩ সেমি ভিতরে আঙুল দিন। ভেজা বা ঠান্ডা-আর্দ্র মনে হলে একটু অপেক্ষা করুন।</p></article>
            <article className="rounded-xl border border-emerald-100 bg-white p-4"><h3 className="font-extrabold text-emerald-950">২. টবের ওজন দেখুন</h3><p className="mt-2 text-sm leading-6 text-slate-600">পানি দেওয়ার পর ও শুকানোর সময় টবের ওজনের পার্থক্য বুঝুন। হালকা pot অনেক সময় শুকনো মাটির ইঙ্গিত।</p></article>
            <article className="rounded-xl border border-emerald-100 bg-white p-4"><h3 className="font-extrabold text-emerald-950">৩. গাছ ও drainage দেখুন</h3><p className="mt-2 text-sm leading-6 text-slate-600">পাতা, soil, drainage hole এবং saucer-এ পানি জমেছে কি না দেখুন; একটি লক্ষণ দিয়ে diagnosis করবেন না।</p></article>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="season">
          <h2 id="season" className="text-2xl font-black text-emerald-950 sm:text-3xl">বাংলাদেশের ঋতু অনুযায়ী watering tips</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-100 bg-white">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead className="bg-emerald-900 text-white"><tr><th className="p-3">সময় / আবহাওয়া</th><th className="p-3">কী পরিবর্তন হয়</th><th className="p-3">আপনার করণীয়</th></tr></thead>
              <tbody className="divide-y divide-emerald-100">
                <tr><td className="p-3 font-bold">গরম ও শুষ্ক দিন</td><td className="p-3">Rooftop pot, ছোট টব ও বাতাসে মাটি দ্রুত শুকাতে পারে।</td><td className="p-3">মাটি ঘন ঘন পরীক্ষা করুন; শুকনো হলে root zone-এ পানি দিন।</td></tr>
                <tr><td className="p-3 font-bold">বর্ষা / আর্দ্রতা</td><td className="p-3">মাটি ধীরে শুকায়; outdoor pot বৃষ্টিতে অতিরিক্ত ভিজতে পারে।</td><td className="p-3">পানি দেওয়ার আগে soil check, drainage পরিষ্কার ও জমা পানি সরান।</td></tr>
                <tr><td className="p-3 font-bold">শীত / ঠান্ডা দিন</td><td className="p-3">অনেক গাছের বৃদ্ধি ধীর হয়; indoor soil শুকাতে বেশি সময় লাগতে পারে।</td><td className="p-3">Watering gap বাড়তে পারে; soil dry না হলে পানি দেবেন না।</td></tr>
                <tr><td className="p-3 font-bold">AC / কম আলো</td><td className="p-3">আলো ও airflow অনুযায়ী evaporation এবং growth বদলায়।</td><td className="p-3">পাশাপাশি থাকা গাছের soil moisture-ও আলাদা করে পরীক্ষা করুন।</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="plant-types">
          <h2 id="plant-types" className="text-2xl font-black text-emerald-950 sm:text-3xl">গাছের ধরন অনুযায়ী পানি দেওয়ার নিয়ম</h2>
          <div className="mt-4 space-y-3">
            {plantGroups.map((item) => <article key={item.plant} className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5"><h3 className="font-extrabold text-emerald-950">{item.plant}</h3><p className="mt-2 text-sm leading-6"><strong>যা পরীক্ষা করবেন:</strong> {item.check}</p><p className="text-sm leading-6 text-slate-600">{item.advice}</p></article>)}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7" aria-labelledby="watering-method">
          <h2 id="watering-method" className="text-2xl font-black text-emerald-950">সঠিকভাবে পানি দেওয়ার পদ্ধতি</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>মাটি শুকানোর অবস্থা ও গাছের water needs পরীক্ষা করুন।</li>
            <li>পানি ধীরে ধীরে মাটির উপর দিন; শুধু পাতায় ছিটিয়ে root zone শুকনো রাখবেন না।</li>
            <li>টবের drainage hole দিয়ে অতিরিক্ত পানি বের হতে দিন, যদি গাছের জন্য উপযুক্ত watering method হয়।</li>
            <li>সসার বা outer pot-এ জমে থাকা পানি ফেলে দিন।</li>
            <li>পানি দেওয়ার পর কয়েকদিন পর্যবেক্ষণ করুন—নতুন schedule নয়, গাছের response শিখুন।</li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="symptoms">
          <h2 id="symptoms" className="text-xl font-black text-amber-950">কম পানি নাকি বেশি পানি—লক্ষণ দেখে বুঝুন</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/80 p-4"><h3 className="font-bold text-amber-950">পানি কম হতে পারে</h3><ul className="mt-2 list-disc pl-5 text-sm leading-6 text-slate-700"><li>মাটি শুকনো ও pot হালকা</li><li>পাতা ঝুলে যাওয়া বা শুকনো কিনারা</li><li>পানি দিলে কিছু গাছ দ্রুত recover করে</li></ul></div>
            <div className="rounded-xl bg-white/80 p-4"><h3 className="font-bold text-amber-950">পানি বেশি / drainage সমস্যা হতে পারে</h3><ul className="mt-2 list-disc pl-5 text-sm leading-6 text-slate-700"><li>দীর্ঘসময় ভেজা মাটি</li><li>হলুদ পাতা বা নরম stem</li><li>দুর্গন্ধ, root damage বা টবে পানি জমা</li></ul></div>
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-950">লক্ষণ একাধিক কারণে হতে পারে। গাছের আলো, তাপমাত্রা, pest ও root condition-ও পরীক্ষা করুন।</p>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7" aria-labelledby="faq">
          <h2 id="faq" className="text-2xl font-black text-emerald-950">সাধারণ প্রশ্ন (FAQ)</h2>
          <div className="mt-4 divide-y divide-emerald-100">
            {faqs.map((faq) => <details key={faq.question} className="group py-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"><span>{faq.question}</span><span aria-hidden="true" className="text-xl text-emerald-800 transition group-open:rotate-45">+</span></summary><p className="pb-2 pt-3 text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-emerald-950 p-5 text-white sm:p-7">
          <h2 className="text-2xl font-black">আরও Plant Care Guide পড়ুন</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/green-living/yellow-leaves-causes-solutions" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold hover:bg-white/10">পাতা হলুদ হলে কী করবেন</Link>
            <Link href="/green-living/low-light-indoor-plants-bangladesh" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold hover:bg-white/10">কম আলোতে indoor plant guide</Link>
            <Link href="/green-living" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold hover:bg-white/10">Green Living-এর সব গাইড</Link>
            <Link href="/plant-market" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950">গাছ ও gardening products</Link>
          </div>
        </section>
        <aside className="mt-8 text-sm leading-7 text-slate-600">এই guide সাধারণ plant-care তথ্য। উদ্ভিদের species, pot, growing medium ও আবহাওয়ার ভিত্তিতে পানি প্রয়োজন পরিবর্তিত হয়।</aside>
        <footer className="mt-8 border-t border-emerald-100 pt-5 text-sm text-slate-600"><Link href="/green-living" className="font-bold text-emerald-800 hover:underline">← Green Living-এ ফিরে যান</Link></footer>
      </div>
    </main>
  );
}
