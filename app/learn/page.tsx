import type {Metadata} from "next";
import Link from "next/link";
import { Bug, Carrot, Leaf, Stethoscope, Trees, Wheat, Sprout } from "lucide-react";
import {LESSONS} from "@/lib/learn/lessons";
import KnowledgeNetwork from "@/components/learn/KnowledgeNetwork";

const site=(process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd").replace(/\/$/,"");
const canonical=site+"/learn";
const title="বাংলাদেশের কৃষি শেখার গাইড";
const description="বাংলাদেশে ধান ও সবজি চাষ, মাটির স্বাস্থ্য, সমন্বিত বালাই ব্যবস্থাপনা এবং ফসলের রোগের লক্ষণ নিয়ে বাংলায় ধাপে ধাপে AGRIVA Learn গাইড ও কুইজ পড়ুন।";

export const metadata:Metadata={
  title,description,
  alternates:{canonical},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1}},
  openGraph:{type:"website",url:canonical,siteName:"AGRIVA",locale:"bn_BD",
    title:title+" | AGRIVA",description,images:[{url:"/branding/agriva-brand-social-share-1200x630.png",width:1200,height:630,alt:"AGRIVA কৃষি শেখার কেন্দ্র"}]},
  twitter:{card:"summary_large_image",title:title+" | AGRIVA",description,images:["/branding/agriva-brand-social-share-1200x630.png"]},
  keywords:["কৃষি শেখার গাইড","ধান চাষ পদ্ধতি","সবজি চাষ বাংলাদেশ","মাটির স্বাস্থ্য","ফসলের রোগ","IPM","agriculture learning Bangladesh"],
};
const features=[
  {href:"/learn/plant-disease",title:"ফসলের রোগ ও লক্ষণ চেনার ল্যাব",tag:"রোগবালাই",duration:"শিক্ষামূলক কেস",icon:Stethoscope,
   description:"ধান, গম, টমেটো, আলু ও অন্যান্য পরিচিত ফসলের রোগের লক্ষণ, সম্ভাব্য কারণ ও নিরাপদ প্রাথমিক ব্যবস্থাপনা জানুন।"},
  {href:"/learn/plant-science",title:"উদ্ভিদ ও বৈজ্ঞানিক নামের Academy",tag:"উদ্ভিদবিদ্যা",duration:"রেফারেন্স + কুইজ",icon:Trees,
   description:"উদ্ভিদের বাংলা ও ইংরেজি নাম, বৈজ্ঞানিক নাম, পরিবার এবং উদ্ভিদ শনাক্তকরণের শেখার উপকরণ দেখুন।"},
];
const lessonIcons=[Wheat,Carrot,Sprout,Bug];
const guides=LESSONS.map((lesson,index)=>({
  href:"/learn/"+lesson.slug,title:lesson.title,tag:lesson.crop,duration:lesson.duration,icon:lessonIcons[index]||Leaf,
  description:lesson.summary,
}));
const allGuides=[...guides,...features];
const questions=[
  {q:"AGRIVA Learn থেকে কী কী বিষয় শিখতে পারব?",
   a:"ধান ও সবজি চাষের মৌলিক ধাপ, মাটির স্বাস্থ্য, সমন্বিত বালাই ব্যবস্থাপনা এবং পরিচিত ফসলের রোগের লক্ষণ শেখার গাইড রয়েছে। প্রতিটি সাধারণ পাঠে ছোট কুইজও আছে।"},
  {q:"ধান চাষ শুরু করার আগে কী জানা দরকার?",
   a:"জাত ও বীজের উৎস, স্থানীয় মৌসুম, জমির পানি নিষ্কাশন, মাটির অবস্থা এবং রোপণের সময় বিবেচনা করুন। এলাকার উপযোগী নির্দিষ্ট সুপারিশ স্থানীয় কৃষি অফিস থেকে যাচাই করুন।"},
  {q:"মাটির জন্য কোন সার কতটুকু দেব?",
   a:"সবার জমির জন্য একই মাত্রা ঠিক নয়। মাটি পরীক্ষার ফল, ফসল, জাত ও স্থানীয় সরকারি সুপারিশ অনুযায়ী সার ব্যবস্থাপনা ঠিক করা ভালো। AGRIVA-এর মাটির স্বাস্থ্য গাইড দিয়ে শুরু করতে পারেন।"},
  {q:"ছবিতে রোগের লক্ষণ মিললেই কি রোগ নিশ্চিত?",
   a:"না। একই দাগ বা ঢলে পড়া একাধিক রোগ, পুষ্টির অভাব বা পরিবেশগত কারণে হতে পারে। আক্রান্ত ফসলের পর্যবেক্ষণ লিখুন এবং প্রয়োজনে উপজেলা কৃষি অফিস বা উদ্ভিদ স্বাস্থ্য বিশেষজ্ঞের সাহায্য নিন।"},
  {q:"AGRIVA Learn-এর গাইড কি বিনামূল্যে পড়া যায়?",
   a:"হ্যাঁ। এই পেজ থেকে প্রকাশিত শেখার গাইড ও শিক্ষামূলক কুইজ কোনো ফি ছাড়া খোলা যায়।"},
];
const structured={
  "@context":"https://schema.org",
  "@graph":[
    {"@type":"CollectionPage","@id":canonical+"#webpage",url:canonical,name:title,description,inLanguage:"bn-BD",
      isAccessibleForFree:true,isPartOf:{"@id":site+"/#website"},publisher:{"@id":site+"/#organization"},
      breadcrumb:{"@id":canonical+"#breadcrumb"},mainEntity:{"@id":canonical+"#guides"},
      about:[{"@type":"Thing",name:"কৃষি শিক্ষা"},{"@type":"Thing",name:"ধান ও সবজি চাষ"},{"@type":"Thing",name:"ফসলের রোগবালাই"}]},
    {"@type":"BreadcrumbList","@id":canonical+"#breadcrumb",itemListElement:[
      {"@type":"ListItem",position:1,name:"AGRIVA",item:site+"/"},
      {"@type":"ListItem",position:2,name:"কৃষি শেখার কেন্দ্র",item:canonical}]},
    {"@type":"ItemList","@id":canonical+"#guides",name:"AGRIVA Learn-এর কৃষি পাঠ ও টুল",
      numberOfItems:allGuides.length,itemListElement:allGuides.map((guide,i)=>({
        "@type":"ListItem",position:i+1,name:guide.title,url:site+guide.href,
      }))},
  ],
};
const safeJson=JSON.stringify(structured).replace(/</g,"\\u003c");

export default function LearnPage(){
  return <main className="min-h-screen bg-[#f6faf7] pb-14 text-[#173b2d]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson}}/>
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-9">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-800">
        <Link href="/" className="hover:underline">AGRIVA হোম</Link><span aria-hidden="true">›</span>
        <span aria-current="page" className="text-slate-600">কৃষি শেখার কেন্দ্র</span>
      </nav>
      <header className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-5 py-9 text-white sm:px-9 sm:py-12">
        <p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-200">AGRIVA LEARN · BANGLADESH</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">বাংলাদেশের কৃষি শেখার গাইড: ফসল চাষ, মাটি ও রোগবালাই</h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-emerald-50 sm:text-base">
          AGRIVA Learn হলো কৃষকদের জন্য বাংলায় কৃষি শেখার কেন্দ্র। এখানে ধান ও সবজি চাষ, মাটির স্বাস্থ্য,
          সমন্বিত বালাই ব্যবস্থাপনা (IPM) এবং ফসলের রোগের লক্ষণ সম্পর্কে ধাপে ধাপে পড়তে পারবেন।
          গাইডে কুইজ ও বাস্তব সমস্যা পর্যবেক্ষণের অনুশীলন রয়েছে।
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href="#crop-guides" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-950 hover:bg-emerald-50">চাষাবাদের গাইড দেখুন</a>
          <a href="#disease-tools" className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/10">ফসলের রোগ সম্পর্কে জানুন</a>
        </div>
      </header>

      <section aria-labelledby="learn-intro" className="mt-8 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6">
          <h2 id="learn-intro" className="text-xl font-black sm:text-2xl">কৃষি শেখা শুরু করবেন কীভাবে?</h2>
          <p className="mt-3 text-sm leading-8 text-slate-700">
            প্রথমে আপনার ফসল বা সমস্যার সঙ্গে মেলে এমন গাইড খুলুন। বীজ বা চারা নির্বাচন, জমি,
            পানি ও পুষ্টি ব্যবস্থাপনার প্রাথমিক বিষয় জানুন। রোগের লক্ষণ পাওয়া গেলে
            রোগের ল্যাবের কেসের সঙ্গে মিলিয়ে দেখুন—তবে নিশ্চিত রোগ নির্ণয়ের বিকল্প হিসেবে ব্যবহার করবেন না।
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
          <h2 className="text-base font-black">দ্রুত যে বিষয়গুলো শিখতে পারবেন</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-emerald-950">
            <li>ধান চাষের বীজ থেকে ফসল কাটার ধাপ</li>
            <li>সবজি চাষে জমি, চারা ও সেচ</li>
            <li>মাটি পরীক্ষা ও সুষম পুষ্টির ভিত্তি</li>
            <li>রোগ-পোকা পর্যবেক্ষণ এবং নিরাপদ IPM</li>
          </ul>
        </div>
      </section>

      <section id="crop-guides" aria-labelledby="crop-guide-heading" className="mt-11 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">ধাপে ধাপে কৃষি পাঠ</p>
            <h2 id="crop-guide-heading" className="mt-2 text-2xl font-black sm:text-3xl">ফসল ও মাটির ব্যবহারিক গাইড</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">নির্দিষ্ট বিষয় বেছে পড়ুন; প্রতিটি গাইডে প্রয়োজনীয় ধাপ, সতর্কতা ও শেখার কুইজ পাবেন।</p>
          </div>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-emerald-800">{LESSONS.length}টি বিস্তারিত গাইড</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {guides.map(guide=><Link href={guide.href} key={guide.href}
            className="group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-6">
            <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden="true"><guide.icon size={26} strokeWidth={1.8} /></span><span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">{guide.duration}</span></div>
            <span className="mt-4 text-xs font-extrabold text-emerald-800">{guide.tag}</span>
            <h3 className="mt-2 text-lg font-black leading-snug text-slate-900 sm:text-xl">{guide.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{guide.description}</p>
            <span className="mt-5 border-t border-slate-100 pt-4 text-sm font-extrabold text-emerald-800 group-hover:underline">গাইডটি পড়ুন <span aria-hidden="true">→</span></span>
          </Link>)}
        </div>
      </section>

      <section id="disease-tools" aria-labelledby="disease-heading" className="mt-11 scroll-mt-24">
        <h2 id="disease-heading" className="text-2xl font-black sm:text-3xl">ফসলের রোগ ও উদ্ভিদ চেনার শিক্ষামূলক টুল</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">একই লক্ষণের একাধিক কারণ থাকতে পারে। ছবি বা বর্ণনার মিলকে নিশ্চিত রোগ নির্ণয় ধরে নেবেন না।</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {features.map(feature=><Link key={feature.href} href={feature.href}
            className="group flex min-w-0 flex-col rounded-2xl border border-emerald-200 bg-white p-5 transition hover:border-emerald-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-6">
            <div className="flex flex-wrap items-center gap-2"><feature.icon size={28} strokeWidth={1.8} aria-hidden="true" className="text-emerald-700" /><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{feature.tag} · {feature.duration}</span></div>
            <h3 className="mt-4 text-lg font-black sm:text-xl">{feature.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{feature.description}</p>
            <span className="mt-5 text-sm font-extrabold text-emerald-800 group-hover:underline">শেখার টুল খুলুন <span aria-hidden="true">→</span></span>
          </Link>)}
        </div>
      </section>

      <section aria-labelledby="learn-faq" className="mt-11 rounded-3xl border border-emerald-100 bg-white p-5 sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">সরাসরি প্রশ্নের উত্তর</p>
        <h2 id="learn-faq" className="mt-2 text-2xl font-black sm:text-3xl">কৃষি শেখা নিয়ে সাধারণ প্রশ্ন</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {questions.map(item=><article key={item.q} className="py-4 first:pt-0 last:pb-0">
            <h3 className="text-base font-extrabold leading-7 text-emerald-950">{item.q}</h3>
            <p className="mt-2 text-sm leading-8 text-slate-700">{item.a}</p>
          </article>)}
        </div>
      </section>

      <section aria-labelledby="more-resources" className="mt-11">
        <h2 id="more-resources" className="text-xl font-black sm:text-2xl">আরও কৃষি তথ্য ও সেবা</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">জ্ঞানকে কাজে লাগাতে AGRIVA-এর প্রাসঙ্গিক সেবাগুলো দেখুন। পণ্য বা সেবা নির্বাচন করার আগে তথ্য যাচাই করুন।</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/crop-calendar" className="rounded-xl border border-emerald-100 bg-white p-4 text-sm font-bold hover:border-emerald-400 hover:text-emerald-800">ফসলের ক্যালেন্ডার <span aria-hidden="true">↗</span></Link>
          <Link href="/agriculture-calculators" className="rounded-xl border border-emerald-100 bg-white p-4 text-sm font-bold hover:border-emerald-400 hover:text-emerald-800">কৃষি ক্যালকুলেটর <span aria-hidden="true">↗</span></Link>
          <Link href="/blog" className="rounded-xl border border-emerald-100 bg-white p-4 text-sm font-bold hover:border-emerald-400 hover:text-emerald-800">কৃষি ব্লগ ও নতুন লেখা <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
      <KnowledgeNetwork current="/learn" className="mt-10" />
      <aside className="mt-9 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        <strong>গুরুত্বপূর্ণ:</strong> এগুলো সাধারণ শিক্ষামূলক তথ্য। জাত, মৌসুম, মাটি, আবহাওয়া ও এলাকার রোগবালাই অনুযায়ী করণীয় বদলায়।
        নির্দিষ্ট সার বা বালাইনাশক ব্যবহারের আগে স্থানীয় কৃষি অফিসের সুপারিশ, নিবন্ধিত পণ্যের লেবেল এবং নিরাপত্তাবিধি যাচাই করুন।
      </aside>
    </div>
  </main>;
}
