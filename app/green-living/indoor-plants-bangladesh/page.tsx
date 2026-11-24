import type { Metadata } from "next";
import Link from "next/link";

const url = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const faqs = [
 {q:"বাংলাদেশে ঘরের জন্য কোন গাছ দিয়ে শুরু করা সহজ?",a:"আপনার ঘরের আলো দেখে গাছ বাছুন। উজ্জ্বল পরোক্ষ আলোতে মানানসই pothos, spider plant বা peace lily-এর মতো গাছ বিবেচনা করা যায়; কম আলো সহ্য করলেও কোনো গাছ সম্পূর্ণ অন্ধকারে ভালো থাকে না। গাছের নির্দিষ্ট চাহিদা বিক্রেতা বা নির্ভরযোগ্য care guide থেকে যাচাই করুন।"},
 {q:"ইনডোর গাছে কত দিন পর পানি দেব?",a:"একটি নির্দিষ্ট দিনভিত্তিক নিয়ম সব গাছের জন্য ঠিক নয়। টবের মাটির ওপরের অংশ ও আর্দ্রতা পরীক্ষা করুন, গাছের ধরন এবং ঋতু বিবেচনা করুন। মাটি ভেজা থাকলে পানি দেওয়ার আগে অপেক্ষা করুন।"},
 {q:"বাংলাদেশের বর্ষায় ইনডোর গাছের যত্ন কীভাবে নেব?",a:"বর্ষায় ঘরের আলো কমে যেতে পারে এবং মাটি ধীরে শুকায়। ড্রেনেজ ছিদ্র খোলা রাখুন, প্রয়োজন ছাড়া পানি দেবেন না, বাতাস চলাচল নিশ্চিত করুন এবং পাতায় পোকা বা দাগ পরীক্ষা করুন।"},
 {q:"এসি রুমে গাছ রাখা যায়?",a:"হ্যাঁ, তবে এসির সরাসরি ঠান্ডা বাতাস, হঠাৎ তাপমাত্রা পরিবর্তন এবং কম আলো থেকে গাছকে সুরক্ষিত রাখুন। গাছের উপযোগী জায়গায় রাখুন এবং মাটির আর্দ্রতা পর্যবেক্ষণ করুন।"},
 {q:"পাতা হলুদ হলে কী করব?",a:"প্রথমে মাটির আর্দ্রতা, ড্রেনেজ, আলো এবং পাতার নিচে পোকা পরীক্ষা করুন। একসঙ্গে পানি, সার ও স্থান পরিবর্তন না করে কারণ বোঝার চেষ্টা করুন; একটি পরিবর্তন করে ফল পর্যবেক্ষণ করুন।"},
];
const faqJsonLd={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))};
const sections = [
 {title:"১. ঘরের আলো বুঝে গাছ নির্বাচন",body:"গাছ কেনার আগে জানালার আলো একদিন পর্যবেক্ষণ করুন। আলো সরাসরি পড়ে, উজ্জ্বল কিন্তু পরোক্ষ থাকে, নাকি বেশিরভাগ সময় ছায়া—এটা বুঝে গাছ বেছে নিন। কম আলো মানে গাছের আলো লাগবে না, এমন নয়।"},
 {title:"২. প্রথমবারের জন্য কিছু পরিচিত indoor plant",body:"Pothos / money plant, snake plant, ZZ plant, spider plant, aglaonema ও peace lily অনেকের ঘরে দেখা যায়। এগুলোও আলো, পানি ও মাটির প্রয়োজন অনুযায়ী যত্ন চাই। কোনো গাছকে আপনার ঘরের আলোতে উপযুক্ত মনে না হলে বিকল্প বেছে নিন।"},
 {title:"৩. টব, মাটি ও ড্রেনেজ",body:"পানি বের হওয়ার ছিদ্রযুক্ত টব ব্যবহার করুন। গাছ ও টবের মাপ অনুযায়ী airy, পানি ধরে রাখে কিন্তু অতিরিক্ত পানি বের হতে পারে এমন growing medium বাছুন। টবের নিচে জমা পানি ফেলে দিন; শুধু decorative pot থাকলে ভেতরের nursery pot আলাদা রাখার সুবিধা হয়।"},
 {title:"৪. পানি দেওয়ার সহজ পদ্ধতি",body:"পানি দেওয়ার আগে মাটির ওপরের ২–৩ সেমি পরীক্ষা করুন—এই মাপ সব গাছের জন্য কঠোর নিয়ম নয়, বরং শুরু করার পর্যবেক্ষণ। কিছু গাছ আরও শুকনো মাটি পছন্দ করে, কিছু গাছ সামান্য আর্দ্রতা পছন্দ করে। পানি দিলে ধীরে দিন এবং অতিরিক্ত পানি বের হতে দিন।"},
 {title:"৫. বাংলাদেশের ঋতু অনুযায়ী যত্ন",body:"গরমে ছোট টব দ্রুত শুকাতে পারে; তীব্র জানালার রোদে পাতায় scorch হতে পারে। বর্ষায় আলো কম ও আর্দ্রতা বেশি থাকলে পানি দেওয়ার ব্যবধান বাড়তে পারে। শীত বা ঘরের ঠান্ডায় বৃদ্ধি ধীর হলে পানির প্রয়োজনও কমতে পারে। সব পরিবর্তন গাছের অবস্থা দেখে করুন।"},
 {title:"৬. এসি, ফ্যান ও বাতাস চলাচল",body:"এসি বা ফ্যানের সরাসরি প্রবাহে সংবেদনশীল গাছ রাখবেন না। ঘর বন্ধ থাকলে বাতাস চলাচল নিশ্চিত করুন, কিন্তু পাতাকে ক্রমাগত জোর বাতাসে রাখবেন না। পাতায় নিয়মিত misting সব গাছের জন্য প্রয়োজনীয় নয়; ভেজা পাতা দীর্ঘক্ষণ থাকলে সমস্যা হতে পারে।"},
 {title:"৭. সমস্যা চিহ্নিত করুন—অতিরিক্ত যত্ন নয়",body:"হলুদ পাতা, ঝুলে পড়া বা বাদামি প্রান্ত একাধিক কারণে হতে পারে। পানি, আলো, শিকড়, পোকা ও তাপমাত্রা পর্যবেক্ষণ করুন। রোগ বা pest নিশ্চিত না হয়ে কীটনাশক ব্যবহার করবেন না এবং লেবেল অনুসরণ করুন।"},
];
export const metadata: Metadata = {
 title:"Indoor Plants in Bangladesh: ঘরের গাছ বাছাই ও যত্ন | AGRIVA",
 description:"বাংলাদেশের গরম, বর্ষা ও ঘরের আলো অনুযায়ী indoor plant বাছাই, পানি, টব-মাটি, এসি রুম, সমস্যা সমাধান ও beginner checklist—সহজ বাংলায়।",
 alternates:{canonical:"/green-living/indoor-plants-bangladesh"},
 openGraph:{type:"article",locale:"bn_BD",url:`${url}/green-living/indoor-plants-bangladesh`,title:"Indoor Plants in Bangladesh | AGRIVA Green Living",description:"বাংলাদেশের ঘরে indoor plant বাছাই ও পরিচর্যার ব্যবহারিক বাংলা গাইড।",siteName:"AGRIVA"},
};
export default function IndoorPlantsBangladesh(){
 return <main className="min-h-screen bg-[#f6faf7] text-slate-900"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}}/><article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
 <nav aria-label="Breadcrumb" className="text-sm text-slate-600"><Link href="/" className="hover:underline">AGRIVA</Link> / <Link href="/green-living" className="hover:underline">Green Living</Link> / Indoor Plants</nav>
 <header className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-700 p-6 text-white sm:p-10"><p className="text-sm font-bold text-emerald-100">BANGLADESH PLANT CARE · BEGINNER GUIDE</p><h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Indoor Plants in Bangladesh: ঘরের গাছ বাছাই ও যত্নের সম্পূর্ণ গাইড</h1><p className="mt-4 max-w-2xl leading-7 text-emerald-50">ঘরের আলো, গরম, বর্ষার আর্দ্রতা ও দৈনন্দিন জীবনযাত্রার সঙ্গে মানানসই গাছ বেছে নিন। গাছকে বুঝে যত্ন নিন—কোনো এক নিয়ম সব গাছের জন্য নয়।</p><div className="mt-6 flex flex-wrap gap-3"><a href="#starter" className="rounded-xl bg-white px-4 py-3 font-bold text-emerald-950">শুরু করার checklist</a><Link href="/plant-market" className="rounded-xl border border-white/40 px-4 py-3 font-bold">Plant Market দেখুন</Link></div></header>
 <section id="starter" className="mt-7 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7"><h2 className="text-2xl font-black text-emerald-950">গাছ কেনার আগে ৫টি প্রশ্ন</h2><ul className="mt-4 space-y-3 text-sm leading-7">{["জানালা থেকে কতটা আলো আসে, আর সরাসরি রোদ পড়ে কি?","গাছ রাখার জায়গায় বাতাস চলাচল আছে?","পানি বের হওয়ার ছিদ্রযুক্ত টব আছে?","গাছের মাটি পরীক্ষা করে পানি দেওয়ার সময় পাব?","পাতা/পোকা নিয়মিত পর্যবেক্ষণ করতে পারব?"].map(x=><li key={x} className="flex gap-2"><span className="font-bold text-emerald-700">✓</span>{x}</li>)}</ul></section>
 <div className="mt-8 space-y-7">{sections.map(s=><section key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-xl font-extrabold text-emerald-950 sm:text-2xl">{s.title}</h2><p className="mt-3 leading-8 text-slate-700">{s.body}</p></section>)}</div>
 <section className="mt-8 rounded-2xl bg-emerald-950 p-5 text-white sm:p-7"><h2 className="text-2xl font-black">সহজ starter shortlist</h2><p className="mt-2 text-emerald-100 leading-7">Money plant / pothos · snake plant · ZZ plant · spider plant · aglaonema · peace lily—আপনার আলো ও পরিচর্যার সময়ের সঙ্গে মিলিয়ে বেছে নিন।</p><Link href="/plant-market" className="mt-4 inline-block rounded-lg bg-white px-4 py-3 font-bold text-emerald-950">গাছ খুঁজুন</Link></section>
 <section className="mt-9"><h2 className="text-2xl font-black text-emerald-950">সাধারণ প্রশ্ন ও উত্তর</h2><div className="mt-4 divide-y rounded-2xl border bg-white px-5">{faqs.map(f=><details key={f.q} className="py-4"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="pt-3 leading-7 text-slate-600">{f.a}</p></details>)}</div></section>
 <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950"><strong>Note:</strong> এটি সাধারণ beginner guide। গাছের প্রজাতি, ঘরের পরিবেশ ও লক্ষণ অনুযায়ী যত্ন পরিবর্তন হয়। সন্দেহজনক pest/disease-এর ক্ষেত্রে সঠিক শনাক্তকরণ ও পণ্যের নির্দেশনা নিন।</section>
 <footer className="mt-8 flex flex-wrap gap-4 border-t pt-5 text-sm font-bold text-emerald-800"><Link href="/green-living" className="underline">Green Living Hub</Link><Link href="/green-living/rooftop-gardening-bangladesh" className="underline">Rooftop Gardening Guide</Link><Link href="/garden" className="underline">Personal Garden</Link></footer>
 </article></main>;
}
