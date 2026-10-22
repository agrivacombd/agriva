import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "বাংলা কৃষি গাইড", description: "বাংলাদেশের কৃষকের জন্য বীজ নির্বাচন, বপনের আগে যাচাই এবং মৌসুমি কৃষি পরিকল্পনার প্রাথমিক বাংলা গাইড।", alternates: { canonical: "/guides" } };

const guides = [
  { slug: "seed-selection", title: "ভালো বীজ বাছাইয়ের প্রাথমিক চেকলিস্ট", description: "ফসল, জাত, প্যাকেটের তথ্য, অঙ্কুরোদ্গম ও মেয়াদ যাচাই করার ধাপ।" },
  { slug: "sowing-preparation", title: "বপনের আগে জমি ও মৌসুম পরিকল্পনা", description: "স্থানীয় আবহাওয়া, মাটি, পানি নিষ্কাশন ও কৃষি সম্প্রসারণ পরামর্শ মিলিয়ে পরিকল্পনা করুন।" },
  { slug: "seed-storage", title: "বীজ সংরক্ষণের সাধারণ নিয়ম", description: "লেবেলের নির্দেশনা, আর্দ্রতা, তাপ ও প্যাকেটের অখণ্ডতা নিয়ে করণীয়।" },
];

export default function GuidesPage() {
  return <main className="min-h-screen bg-[#f5f7f2] px-5 py-12 text-[#17351f]"><div className="mx-auto max-w-5xl"><Link href="/blog" className="text-sm font-bold text-emerald-800 underline">AGRIVA ব্লগ</Link><p className="mt-6 text-sm font-bold uppercase tracking-widest text-amber-700">AGRIVA কৃষি জ্ঞান</p><h1 className="mt-3 text-4xl font-black">বাংলা কৃষি গাইড</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">সাধারণ শিক্ষামূলক তথ্য। ফসল ও এলাকার ভিত্তিতে সিদ্ধান্ত নেওয়ার আগে স্থানীয় কৃষি সম্প্রসারণ কর্মকর্তা বা সরকারি কৃষি নির্দেশনা যাচাই করুন।</p><div className="mt-8 grid gap-4 md:grid-cols-3">{guides.map(g=><Link key={g.slug} href={`/guides/${g.slug}`} className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"><h2 className="text-xl font-black">{g.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{g.description}</p><span className="mt-5 inline-block text-sm font-bold text-emerald-800">গাইড পড়ুন →</span></Link>)}</div><p className="mt-8 text-sm">পণ্য খুঁজছেন? <Link href="/marketplace" className="font-bold underline">AGRIVA Marketplace</Link> দেখুন।</p></div></main>;
}
