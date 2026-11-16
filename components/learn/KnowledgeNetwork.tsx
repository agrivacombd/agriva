import Link from "next/link";

/** The four canonical knowledge hubs. Never create duplicate article URLs. */
export const KNOWLEDGE_HUB_PATHS = [
  {href:"/learn",name:"কৃষি শেখার কেন্দ্র",description:"ধান ও সবজি চাষ, মাটি এবং সমন্বিত বালাই ব্যবস্থাপনার ধাপে ধাপে পাঠ।",cta:"ফসল চাষ শিখুন",icon:"🌾"},
  {href:"/learn/plant-disease",name:"ফসলের রোগ ও লক্ষণ",description:"রোগের সম্ভাব্য লক্ষণ, কারণ, প্রাথমিক করণীয় ও নিরাপদ প্রতিরোধের শিক্ষামূলক কেস।",cta:"রোগের লক্ষণ জানুন",icon:"🩺"},
  {href:"/learn/plant-science",name:"উদ্ভিদ পরিচিতি ও বৈজ্ঞানিক নাম",description:"উদ্ভিদের বাংলা-ইংরেজি ও বৈজ্ঞানিক নাম, পরিবার এবং অনুশীলন।",cta:"উদ্ভিদ পরিচিতি পড়ুন",icon:"🌿"},
  {href:"/blog",name:"কৃষি ব্লগ ও প্রবন্ধ",description:"কৃষি প্রবন্ধ ও Learn গাইডের ফিড থেকে আরও প্রাসঙ্গিক লেখা খুঁজুন।",cta:"কৃষি প্রবন্ধ দেখুন",icon:"📚"},
] as const;

export type KnowledgeHubPath = typeof KNOWLEDGE_HUB_PATHS[number]["href"];

export default function KnowledgeNetwork({current,className=""}:{current?:KnowledgeHubPath;className?:string}){
  const related=KNOWLEDGE_HUB_PATHS.filter(item=>item.href!==current);
  return <nav aria-label="সম্পর্কিত কৃষি জ্ঞান" className={"min-w-0 rounded-3xl border border-emerald-100 bg-[#f3f8f2] p-4 text-[#174330] sm:p-6 "+className}>
    <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">AGRIVA KNOWLEDGE HUB</p>
    <h2 className="mt-1 text-xl font-black sm:text-2xl">আরও কৃষি তথ্য ও গাইড</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">ফসল চাষের ধাপ থেকে রোগের লক্ষণ, উদ্ভিদের পরিচিতি ও কৃষি প্রবন্ধ—প্রাসঙ্গিক বিষয়গুলোতে সহজে যান।</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {related.map(item=><Link key={item.href} href={item.href}
        className="group flex min-w-0 flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:border-emerald-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-2xl">{item.icon}</span>
          <span className="min-w-0"><span className="block text-base font-extrabold leading-6 text-emerald-950">{item.name}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{item.description}</span></span>
        </div>
        <span className="mt-auto block pt-3 text-xs font-extrabold text-emerald-800 group-hover:underline">{item.cta} <span aria-hidden="true">→</span></span>
      </Link>)}
    </div>
  </nav>;
}
