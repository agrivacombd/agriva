import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = `${siteUrl}/green-living/yellow-leaves-causes-solutions`;

export const metadata: Metadata = {
  title: "গাছের পাতা হলুদ কেন? কারণ ও সমাধান | AGRIVA",
  description: "গাছের পাতা হলুদ হওয়ার সম্ভাব্য কারণ—অতিরিক্ত পানি, কম আলো, পুষ্টি, পোকা ও স্বাভাবিক পুরোনো পাতা। লক্ষণ বুঝে নিরাপদ সমাধান জানুন।",
  alternates: { canonical: "/green-living/yellow-leaves-causes-solutions" },
  openGraph: { type: "article", locale: "bn_BD", url: pageUrl, title: "গাছের পাতা হলুদ কেন? Causes & Solutions", description: "Yellow leaves troubleshooting guide—বাংলাদেশের ঘরের গাছ ও বাগানের জন্য practical checklist.", siteName: "AGRIVA" },
};

const faqs = [
 {question:"গাছের পাতা হলুদ হলে প্রথমে কী করব?",answer:"আগে মাটি কতটা ভেজা, drainage, আলো, পাতার নিচে পোকা এবং হলুদ হওয়া পাতার pattern পরীক্ষা করুন। একসঙ্গে সার, পানি ও স্থান পরিবর্তন করে ফেলবেন না—সম্ভাব্য কারণ আলাদা করে যাচাই করুন।"},
 {question:"অতিরিক্ত পানি দিলে কি পাতা হলুদ হয়?",answer:"হ্যাঁ, দীর্ঘসময় ভেজা মাটি শিকড়ের oxygen কমাতে ও root damage ঘটাতে পারে, যার ফলে হলুদ পাতা বা ঝিমিয়ে পড়া দেখা যায়। তবে হলুদ পাতা একা overwatering নিশ্চিত করে না।"},
 {question:"কোন পাতা হলুদ হলে স্বাভাবিক?",answer:"অনেক গাছে পুরোনো নিচের পাতা ধীরে হলুদ হয়ে ঝরে যেতে পারে, বিশেষত নতুন বৃদ্ধি স্বাভাবিক থাকলে। হঠাৎ অনেক পাতা হলুদ হলে বা নতুন পাতাও আক্রান্ত হলে কারণ খুঁজুন।"},
 {question:"হলুদ পাতা দেখলেই কি fertilizer দেব?",answer:"না। অতিরিক্ত সার শিকড় ক্ষতিগ্রস্ত করতে পারে। আগে watering, আলো, drainage, pest এবং গাছের growth season যাচাই করুন। পুষ্টির ঘাটতি সম্ভাব্য হলে গাছ ও growing medium অনুযায়ী label নির্দেশনা অনুসরণ করুন।"},
 {question:"পাতা হলুদ ও বাদামি কিনারা—কারণ কী?",answer:"শুকনো মাটি, অনিয়মিত পানি, কম humidity, অতিরিক্ত সার বা পানিতে লবণ জমাসহ একাধিক কারণ হতে পারে। মাটি ও পরিবেশ পর্যবেক্ষণ করে একটি করে পরিবর্তন করুন।"},
 {question:"হলুদ পাতা কেটে ফেলব?",answer:"পুরোপুরি হলুদ, শুকনো বা সহজে খুলে আসা পাতাটি পরিষ্কার কাঁচি দিয়ে সরাতে পারেন। আংশিক সবুজ পাতায় photosynthesis চলতে পারে; কারণ না বুঝে সব আক্রান্ত পাতা কেটে ফেলবেন না।"},
];

const checks = [
 {title:"Overwatering / drainage",sign:"একাধিক পাতা হলুদ, মাটি দীর্ঘসময় ভেজা, pot ভারী, গন্ধ বা stem নরম।",action:"পানি দেওয়ার বিরতি দিন, drainage hole ও saucer পরীক্ষা করুন। শিকড় পচনের সন্দেহে root inspection এবং প্রয়োজন হলে fresh, well-draining mix-এ repot করুন।"},
 {title:"Underwatering / শুকনো মাটি",sign:"মাটি শুকনো, pot হালকা, পাতা ঝুলে বা কিনারা crisp।",action:"গাছের উপযোগী পদ্ধতিতে root zone পুরোপুরি ভিজিয়ে পানি দিন এবং পরবর্তীতে মাটি পরীক্ষা করে schedule সামঞ্জস্য করুন।"},
 {title:"আলো কম বা অতিরিক্ত সরাসরি রোদ",sign:"কম আলোতে ধীর বৃদ্ধি, দীর্ঘ/দুর্বল stem; কড়া রোদে পোড়া দাগ বা ফ্যাকাশে patch হতে পারে।",action:"গাছের আলো চাহিদা অনুযায়ী উজ্জ্বল পরোক্ষ আলোতে ধীরে স্থানান্তর করুন। হঠাৎ তীব্র রোদে দেবেন না।"},
 {title:"পুষ্টি / growing medium",sign:"পুরোনো বা নতুন পাতার নির্দিষ্ট pattern-এ বিবর্ণতা; বৃদ্ধি কমে যাওয়া।",action:"আগে root health, watering ও আলো ঠিক আছে কি না যাচাই করুন। নিশ্চিত প্রয়োজন হলে গাছের উপযোগী fertilizer label অনুযায়ী ব্যবহার করুন।"},
 {title:"Pests",sign:"পাতার নিচে ক্ষুদ্র পোকা, webbing, sticky residue, stippling বা দাগ।",action:"আক্রান্ত গাছ আলাদা রাখুন, পাতার দুই পাশ পরীক্ষা ও পরিষ্কার করুন; শনাক্তকৃত pest অনুযায়ী উপযুক্ত treatment এবং label মেনে চলুন।"},
 {title:"স্বাভাবিক পুরোনো পাতা",sign:"এক-দুটি পুরোনো নিচের পাতা ধীরে হলুদ, নতুন বৃদ্ধি healthy।",action:"পর্যবেক্ষণ করুন; দ্রুত ছড়াচ্ছে না হলে স্বাভাবিক leaf turnover হতে পারে।"},
];

const articleJsonLd = {
 "@context":"https://schema.org","@type":"Article",
 headline:"গাছের পাতা হলুদ কেন? Causes & Solutions",
 description:"হলুদ পাতার সম্ভাব্য কারণ শনাক্ত ও নিরাপদ troubleshooting.",
 mainEntityOfPage:pageUrl,inLanguage:"bn-BD",
 author:{"@type":"Organization",name:"AGRIVA"},
 publisher:{"@type":"Organization",name:"AGRIVA",url:siteUrl},
};
const faqJsonLd = {"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(f=>({"@type":"Question",name:f.question,acceptedAnswer:{"@type":"Answer",text:f.answer}}))};

export default function YellowLeavesGuide() {
 return <main className="min-h-screen bg-[#f6faf7] text-slate-900">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify([articleJsonLd,faqJsonLd]).replace(/</g,"\\u003c")}}/>
  <div className="mx-auto max-w-4xl px-4 pb-14 pt-5 sm:px-6">
   <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-600"><Link href="/" className="font-semibold hover:text-emerald-800">AGRIVA</Link><span>/</span><Link href="/green-living" className="font-semibold hover:text-emerald-800">Green Living</Link><span>/</span><span aria-current="page" className="font-semibold text-emerald-900">Yellow Leaves Guide</span></nav>
   <header className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-5 py-9 text-white sm:px-9 sm:py-12">
    <p className="text-xs font-black tracking-widest text-emerald-200">AGRIVA GREEN LIVING · TROUBLESHOOTING</p>
    <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">গাছের পাতা হলুদ কেন? Causes & Solutions</h1>
    <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50">একটি হলুদ পাতা মানেই fertilizer deficiency নয়। পানি, আলো, শিকড়, পোকা, ঋতু ও পুরোনো পাতার স্বাভাবিক পরিবর্তন—কোনটি কারণ হতে পারে, ধাপে ধাপে পরীক্ষা করুন।</p>
   </header>
   <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7">
    <p className="text-xs font-black tracking-wider text-emerald-800">QUICK ANSWER</p><h2 className="mt-2 text-xl font-black text-emerald-950">পাতা হলুদ হলে আগে এই ৫টি জিনিস দেখুন</h2>
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700"><li>মাটি খুব ভেজা নাকি একেবারে শুকনো?</li><li>টবের পানি বের হওয়ার hole খোলা আছে কি?</li><li>গাছ পর্যাপ্ত আলো পাচ্ছে, নাকি সরাসরি রোদে পুড়ছে?</li><li>পাতার নিচে pest, web বা sticky marks আছে কি?</li><li>শুধু পুরোনো নিচের পাতা হলুদ, নাকি নতুন পাতাও আক্রান্ত?</li></ol>
    <p className="mt-3 text-sm leading-7 text-slate-600">একবারে একটি কারণ যাচাই করুন এবং পরিবর্তনের পর কয়েকদিন গাছ পর্যবেক্ষণ করুন।</p>
   </section>
   <section className="mt-8" aria-labelledby="causes"><h2 id="causes" className="text-2xl font-black text-emerald-950 sm:text-3xl">সম্ভাব্য কারণ ও কী করবেন</h2><div className="mt-4 space-y-3">
    {checks.map((c,i)=><article key={c.title} className="rounded-2xl border border-emerald-100 bg-white p-5"><h3 className="text-lg font-extrabold text-emerald-950">{i+1}. {c.title}</h3><p className="mt-2 text-sm leading-7 text-slate-700"><strong>লক্ষণ:</strong> {c.sign}</p><p className="text-sm leading-7 text-slate-600"><strong>সমাধান:</strong> {c.action}</p></article>)}
   </div></section>
   <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7" aria-labelledby="pattern"><h2 id="pattern" className="text-2xl font-black text-emerald-950">পাতার pattern দেখে প্রাথমিক ধারণা</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-emerald-900 text-white"><tr><th className="p-3">কোথায় হলুদ</th><th className="p-3">কী যাচাই করবেন</th></tr></thead><tbody className="divide-y divide-emerald-100"><tr><td className="p-3 font-semibold">পুরোনো নিচের পাতা</td><td className="p-3">স্বাভাবিক leaf turnover, পানি ও আলো</td></tr><tr><td className="p-3 font-semibold">অনেক পাতা একসঙ্গে</td><td className="p-3">watering, root health, পরিবেশে হঠাৎ পরিবর্তন</td></tr><tr><td className="p-3 font-semibold">নতুন পাতায় বিবর্ণতা</td><td className="p-3">root condition, growing medium, nutrient availability</td></tr><tr><td className="p-3 font-semibold">হলুদের সঙ্গে বাদামি দাগ</td><td className="p-3">pest, sun scorch, dryness বা অন্যান্য stress</td></tr></tbody></table></div><p className="mt-3 text-sm leading-7 text-slate-600">এগুলো clue মাত্র; পাতার pattern দিয়ে একা রোগ বা nutrient deficiency নিশ্চিত করা যায় না।</p></section>
   <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-xl font-black text-amber-950">যা এড়িয়ে চলবেন</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-amber-950"><li>কারণ না বুঝে বেশি পানি বা fertilizer দেওয়া।</li><li>গাছকে বারবার জায়গা বদলানো বা হঠাৎ direct sun-এ দেওয়া।</li><li>pest নিশ্চিত না করে pesticide spray করা।</li><li>drainage বন্ধ রেখে pot-এর নিচে পানি জমিয়ে রাখা।</li></ul></section>
   <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7" aria-labelledby="faq"><h2 id="faq" className="text-2xl font-black text-emerald-950">সাধারণ প্রশ্ন (FAQ)</h2><div className="mt-4 divide-y divide-emerald-100">{faqs.map(f=><details key={f.question} className="group py-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"><span>{f.question}</span><span aria-hidden="true" className="text-xl text-emerald-800 transition group-open:rotate-45">+</span></summary><p className="pb-2 pt-3 text-sm leading-7 text-slate-600">{f.answer}</p></details>)}</div></section>
   <section className="mt-8 rounded-2xl bg-emerald-950 p-5 text-white sm:p-7"><h2 className="text-2xl font-black">আরও Plant Care Guide</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Link href="/green-living/how-often-to-water-plants-bangladesh" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold hover:bg-white/10">পানি দেওয়ার guide</Link><Link href="/green-living/low-light-indoor-plants-bangladesh" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold hover:bg-white/10">কম আলোতে indoor plants</Link><Link href="/green-living" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950">Green Living hub</Link></div></section>
   <aside className="mt-8 text-sm leading-7 text-slate-600">এই guide সাধারণ plant-care তথ্য। লক্ষণ একাধিক কারণে হতে পারে; সমস্যা গুরুতর, দ্রুত ছড়ালে বা রোগ/পেস্ট সন্দেহ হলে স্থানীয় উদ্ভিদ বিশেষজ্ঞের সাহায্য নিন।</aside>
   <footer className="mt-8 border-t border-emerald-100 pt-5 text-sm text-slate-600"><Link href="/green-living" className="font-bold text-emerald-800 hover:underline">← Green Living-এ ফিরে যান</Link></footer>
  </div>
 </main>;
}
