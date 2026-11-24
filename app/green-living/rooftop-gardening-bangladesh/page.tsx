import type { Metadata } from "next";
import Link from "next/link";

const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const faqs=[
 {q:"ছাদবাগান শুরু করার আগে সবচেয়ে জরুরি কী?",a:"ছাদের নিরাপদ load capacity, waterproofing, drainage, সূর্যালোক, পানি সরবরাহ ও নিরাপদ চলাচল যাচাই করুন। ভারী টব বা স্থায়ী bed বসানোর আগে structural engineer-এর পরামর্শ নিন।"},
 {q:"ছাদে কোন গাছ লাগানো সহজ?",a:"আপনার ছাদের রোদ ও বাতাস বুঝে বেছে নিন। শাক, মরিচ, টমেটো, তুলসী, গাঁদা, জবা বা বোগেনভিলিয়া বিবেচনা করতে পারেন—তবে প্রতিটি গাছের পাত্র, আলো ও ঋতুর চাহিদা আলাদা।"},
 {q:"ছাদবাগানে কতবার পানি দিতে হয়?",a:"নির্দিষ্ট সময়সূচি নয়; মাটির আর্দ্রতা, গাছ, পাত্র, রোদ, বাতাস ও বৃষ্টির ওপর নির্ভর করুন। গরম ও বাতাসে ছোট পাত্র দ্রুত শুকাতে পারে; বর্ষায় অতিরিক্ত পানি জমার ঝুঁকি থাকে।"},
 {q:"বর্ষায় ছাদবাগান কীভাবে রক্ষা করব?",a:"ড্রেনেজ ছিদ্র পরিষ্কার রাখুন, ছাদের drain-এ পাতা জমতে দেবেন না, স্থিতিশীল পাত্র ব্যবহার করুন, waterlogging দেখুন এবং প্রয়োজনমতো গাছের মধ্যে airflow রাখুন। স্থায়ী drain বা waterproofing নিজে পরিবর্তন করবেন না।"},
 {q:"বাড়ির ছাদে বড় টব বা raised bed বসানো নিরাপদ?",a:"এটি ভবনের কাঠামো, টবের আকার, মাটির পরিমাণ ও ভেজা অবস্থার ওজনের ওপর নির্ভর করে। নির্দিষ্ট নিরাপদ capacity অনুমান করবেন না; qualified structural professional দিয়ে মূল্যায়ন করান।"},
];
const schema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))};
const blocks=[
 ["১. আগে ছাদটি পর্যবেক্ষণ করুন","একটি দিন ধরে সকাল, দুপুর ও বিকেলের রোদ কোথায় পড়ে দেখুন। বাতাসের তীব্রতা, ছায়া, পানি আনার পথ, drain ও চলাচলের জায়গা নোট করুন।"],
 ["২. নিরাপত্তা, ওজন ও waterproofing","ভেজা মাটি, পানি, বড় টব ও planter শুকনো অবস্থার চেয়ে অনেক ভারী হতে পারে। ছাদের capacity অনুমান করে বাগান বসাবেন না। ফাটল, leak বা waterproofing সমস্যা আগে সমাধান করুন; বড় planter, raised bed বা স্থায়ী কাঠামোর আগে structural engineer-এর মূল্যায়ন নিন।"],
 ["৩. জায়গা অনুযায়ী garden plan","প্রবেশ ও চলাচলের পথ ফাঁকা রাখুন। টব এমনভাবে সাজান যাতে পানি drain-এ যেতে পারে এবং নিচের তলায় পানি ঝরে সমস্যা না হয়। দেয়াল/রেলিংয়ে ঝুলন্ত planter বা trellis বসালে সেগুলোর anchoring ও নিরাপত্তা professional দিয়ে যাচাই করুন।"],
 ["৪. টব ও growing medium","গাছের শিকড়ের উপযোগী আকারের পাত্র, drainage hole এবং উপযুক্ত growing medium ব্যবহার করুন। সব গাছের জন্য এক মাটির recipe নয়। পানি আটকে যায় বা medium compact হয়ে গেলে গাছের প্রয়োজন বুঝে সংশোধন করুন।"],
 ["৫. ছাদের রোদ অনুযায়ী গাছ","রোদযুক্ত স্থানে sun-tolerant ফল/সবজি/ফুলের গাছ বেছে নিন; আংশিক ছায়ায় উপযুক্ত leafy greens বা shade-tolerant গাছ বিবেচনা করুন। আলো দেখে প্রজাতি নির্বাচন করুন, শুধু নামের তালিকা ধরে নয়।"],
 ["৬. বাংলাদেশে ঋতুভিত্তিক রক্ষণাবেক্ষণ","গরম ও শুষ্ক সময়ে মাটির আর্দ্রতা ঘন ঘন পরীক্ষা করুন, তীব্র দুপুরের রোদে সংবেদনশীল গাছকে উপযুক্ত shade দিন। বর্ষায় waterlogging, drainage, ভেজা পাতার রোগ ও ঝড়ো বাতাসের জন্য প্রস্তুত থাকুন। শীতকালে বৃদ্ধি ও শুকানোর গতি বদলালে watering/fertilizing routine সামঞ্জস্য করুন।"],
 ["৭. পানি ও নিষ্কাশন","পানি ধীরে দিন যাতে root zone ভিজে, কিন্তু টবে পানি জমে না থাকে। বৃষ্টির পরে container drain ও roof drain পরীক্ষা করুন। ছাদের fixed drainage, waterproof membrane বা plumbing নিজে পরিবর্তন করবেন না; building maintenance/qualified professional ডাকুন।"],
 ["৮. পোকা ও রোগের প্রাথমিক নজরদারি","পাতার নিচে, নতুন কুঁড়ি ও কাণ্ডে pest লক্ষণ দেখুন। আক্রান্ত গাছ আলাদা করা যায় কি না বিবেচনা করুন, পরিষ্কার tools ব্যবহার করুন এবং কারণ নিশ্চিত না হয়ে pesticide প্রয়োগ করবেন না।"],
];
export const metadata: Metadata={
 title:"Rooftop Gardening Guide Bangladesh: ছাদবাগান শুরু ও যত্ন | AGRIVA",
 description:"বাংলাদেশে ছাদবাগান শুরু করার নিরাপদ পরিকল্পনা: ছাদের load, রোদ, টব-মাটি, পানি ও drainage, গরম-বর্ষার যত্ন, beginner plants ও FAQ।",
 alternates:{canonical:"/green-living/rooftop-gardening-bangladesh"},
 openGraph:{type:"article",locale:"bn_BD",url:`${site}/green-living/rooftop-gardening-bangladesh`,title:"Rooftop Gardening Guide Bangladesh | AGRIVA",description:"ঢাকা ও বাংলাদেশের ছাদবাগান পরিকল্পনা, নিরাপত্তা, ঋতুভিত্তিক পরিচর্যার সহজ বাংলা গাইড।",siteName:"AGRIVA"}
};
export default function RooftopGuide(){
 return <main className="min-h-screen bg-[#f6faf7] text-slate-900"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/><article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
 <nav aria-label="Breadcrumb" className="text-sm text-slate-600"><Link href="/" className="hover:underline">AGRIVA</Link> / <Link href="/green-living" className="hover:underline">Green Living</Link> / Rooftop Gardening</nav>
 <header className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-lime-800 p-6 text-white sm:p-10"><p className="text-sm font-bold text-lime-100">BANGLADESH · URBAN GARDENING</p><h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Rooftop Gardening Guide Bangladesh: নিরাপদে ছাদবাগান শুরু করুন</h1><p className="mt-4 max-w-2xl leading-7 text-green-50">ঢাকা ও বাংলাদেশের শহরে ছাদে গাছ লাগানোর আগে ছাদের নিরাপত্তা, রোদ, পানি, drainage এবং ঋতুর চ্যালেঞ্জ বুঝে পরিকল্পনা করুন।</p><div className="mt-6 flex flex-wrap gap-3"><a href="#plan" className="rounded-xl bg-white px-4 py-3 font-bold text-emerald-950">Setup checklist</a><Link href="/plant-market" className="rounded-xl border border-white/40 px-4 py-3 font-bold">Plant Market</Link></div></header>
 <section id="plan" className="mt-7 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7"><h2 className="text-2xl font-black text-emerald-950">ছাদবাগান শুরুর checklist</h2><ul className="mt-4 space-y-3 text-sm leading-7">{["ছাদের structural capacity পেশাদারের কাছে যাচাই করা","ফাটল বা waterproofing সমস্যা পরীক্ষা করা","সারা দিনের আলো, ছায়া ও বাতাস নোট করা","পানি ও drainage-এর পরিকল্পনা করা","চলাচল, emergency access এবং নিরাপদ railing ফাঁকা রাখা","ছোট ও manageable সংখ্যক পাত্র দিয়ে শুরু করা"].map(t=><li key={t} className="flex gap-2"><span className="text-emerald-700 font-bold">✓</span>{t}</li>)}</ul></section>
 <div className="mt-8 space-y-6">{blocks.map(([title,body])=><section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-xl font-extrabold text-emerald-950 sm:text-2xl">{title}</h2><p className="mt-3 leading-8 text-slate-700">{body}</p></section>)}</div>
 <section className="mt-8 rounded-2xl bg-emerald-950 p-5 text-white sm:p-7"><h2 className="text-2xl font-black">Beginner-friendly plant ideas</h2><p className="mt-3 leading-7 text-emerald-100">শাকপাতা, মরিচ, টমেটো, তুলসী, গাঁদা, জবা, বোগেনভিলিয়া—ছাদের আলো, বাতাস ও পাত্রের উপযোগিতা মিলিয়ে বিবেচনা করুন। স্থানীয় মৌসুম, seedling quality ও নির্দিষ্ট variety অনুযায়ী ফলাফল বদলাতে পারে।</p><Link href="/plant-market" className="mt-4 inline-block rounded-lg bg-white px-4 py-3 font-bold text-emerald-950">গাছ ও বাগানের উপকরণ দেখুন</Link></section>
 <section className="mt-9"><h2 className="text-2xl font-black text-emerald-950">ছাদবাগান নিয়ে FAQ</h2><div className="mt-4 divide-y rounded-2xl border bg-white px-5">{faqs.map(f=><details key={f.q} className="py-4"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="pt-3 leading-7 text-slate-600">{f.a}</p></details>)}</div></section>
 <aside className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950"><strong>Safety first:</strong> ছাদের structural capacity, waterproofing বা স্থায়ী drainage বিষয়ে অনুমান করবেন না। বড়/ভারী planter, raised bed বা কাঠামো স্থাপনের আগে building management ও qualified structural/waterproofing professional-এর পরামর্শ নিন।</aside>
 <footer className="mt-8 flex flex-wrap gap-4 border-t pt-5 text-sm font-bold text-emerald-800"><Link href="/green-living" className="underline">Green Living Hub</Link><Link href="/green-living/indoor-plants-bangladesh" className="underline">Indoor Plants Guide</Link><Link href="/garden" className="underline">Personal Garden</Link></footer>
 </article></main>;
}
