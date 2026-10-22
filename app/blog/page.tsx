import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "বাংলা কৃষি গাইড ও কৃষি ব্লগ | AGRIVA",
  description: "বাংলাদেশের কৃষকের জন্য বীজ নির্বাচন, ফসলের যত্ন, কৃষি পণ্য ও ব্যবহারিক কৃষি জ্ঞান—সহজ বাংলায় পড়ুন।",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
    title: "বাংলা কৃষি গাইড ও কৃষি ব্লগ | AGRIVA",
    description: "বাংলাদেশের কৃষকের জন্য বীজ নির্বাচন, ফসলের যত্ন ও ব্যবহারিক কৃষি জ্ঞান—সহজ বাংলায় পড়ুন।",
    url: "/blog",
  },
  twitter: {
    card: "summary",
    title: "বাংলা কৃষি গাইড ও কৃষি ব্লগ | AGRIVA",
    description: "বীজ নির্বাচন, ফসলের যত্ন ও ব্যবহারিক কৃষি জ্ঞান—বাংলাদেশের কৃষকের জন্য।",
  },
};
const guides=[{href:"/guides/seed-selection",title:"ভালো বীজ বাছাই",description:"জাত, লেবেল, অঙ্কুরোদ্গম ও মেয়াদ যাচাইয়ের চেকলিস্ট।"},{href:"/guides/sowing-preparation",title:"বপনের আগে প্রস্তুতি",description:"মৌসুম, জমি, পানি ও স্থানীয় কৃষি পরামর্শ নিয়ে পরিকল্পনা।"},{href:"/guides/seed-storage",title:"বীজ সংরক্ষণ",description:"আর্দ্রতা, তাপ ও প্যাকেটের অখণ্ডতা নিয়ে সাধারণ নির্দেশনা।"}];
export default function Blog(){return <main className="min-h-screen bg-[#f5f7f2] px-6 py-14 text-[#17351f]"><div className="mx-auto max-w-6xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Knowledge</p><h1 className="mt-3 text-4xl font-black md:text-5xl">বাংলা কৃষি গাইড</h1><p className="mt-4 max-w-2xl leading-7 text-[#647468]">বাংলাদেশের কৃষকের জন্য ব্যবহারিক, সহজবোধ্য কৃষি জ্ঞান। নির্দিষ্ট ফসল ও এলাকার সিদ্ধান্তে স্থানীয় কৃষি সম্প্রসারণ পরামর্শ যাচাই করুন।</p><div className="mt-8 grid gap-4 md:grid-cols-3">{guides.map(g=><Link key={g.href} href={g.href} className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md"><h2 className="text-xl font-black">{g.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{g.description}</p><span className="mt-5 inline-block text-sm font-bold text-emerald-800">বিস্তারিত পড়ুন →</span></Link>)}</div><p className="mt-8 text-sm">কৃষি উপকরণ খুঁজুন: <Link href="/marketplace" className="font-bold underline">AGRIVA Marketplace</Link> · <Link href="/guides" className="font-bold underline">সব বাংলা গাইড</Link></p></div></main>}