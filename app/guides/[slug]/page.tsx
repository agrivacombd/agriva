import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const guides: Record<string, { title: string; description: string; sections: { heading: string; body: string }[] }> = {
  "seed-selection": { title: "ভালো বীজ বাছাইয়ের প্রাথমিক চেকলিস্ট", description: "ফসলের উপযোগী ও মানসম্মত বীজ কেনার আগে যে বিষয়গুলো যাচাই করবেন।", sections: [
    { heading: "ফসল ও জাত মিলিয়ে নিন", body: "আপনার জমি, এলাকার মৌসুম, মাটির ধরন এবং কাঙ্ক্ষিত ফসলের সঙ্গে জাতটি উপযোগী কি না যাচাই করুন। স্থানীয় কৃষি সম্প্রসারণ অধিদপ্তর বা কৃষি কর্মকর্তার পরামর্শ নিন।" },
    { heading: "প্যাকেটের লেবেল পড়ুন", body: "ফসল ও জাতের নাম, প্যাকেটের ওজন, উৎপাদক/বিপণনকারীর তথ্য, ব্যাচ বা লট নম্বর, প্যাকিং বা মেয়াদ-সংক্রান্ত তথ্য এবং প্রযোজ্য মানচিহ্ন থাকলে সেগুলো দেখুন। সিল ভাঙা বা অস্পষ্ট লেবেলের প্যাকেট এড়িয়ে চলুন।" },
    { heading: "অঙ্কুরোদ্গম ও সংরক্ষণ", body: "অঙ্কুরোদ্গমের হার উল্লেখ থাকলে সেটি ও পরীক্ষার তারিখ যাচাই করুন। সংরক্ষণের নির্দেশনা মানুন এবং ভেজা, ছেঁড়া বা অতিরিক্ত গরমে রাখা প্যাকেট কিনবেন না।" },
    { heading: "কেনার পর রেকর্ড রাখুন", body: "রসিদ, প্যাকেটের লেবেল ও ব্যাচ নম্বর সংরক্ষণ করুন। সন্দেহ হলে বিক্রেতা এবং স্থানীয় কৃষি কর্মকর্তার সঙ্গে যোগাযোগ করুন।" },
  ] },
  "sowing-preparation": { title: "বপনের আগে জমি ও মৌসুম পরিকল্পনা", description: "বপনের আগে জমি, পানি ও স্থানীয় মৌসুম বিবেচনার একটি সাধারণ তালিকা।", sections: [
    { heading: "স্থানীয় সময়সূচি যাচাই", body: "একই ফসলের বপনকাল এলাকা, জাত, আবহাওয়া ও সেচ-সুবিধা অনুযায়ী বদলাতে পারে। স্থানীয় কৃষি অফিসের সর্বশেষ নির্দেশনা অনুসরণ করুন; শুধু সাধারণ অনলাইন ক্যালেন্ডারের ওপর নির্ভর করবেন না।" },
    { heading: "জমি ও পানি", body: "মাটির অবস্থা, পানি নিষ্কাশন, সেচের সুযোগ এবং আগের ফসলের অবশিষ্টাংশ পর্যবেক্ষণ করুন। প্রয়োজন হলে মাটি পরীক্ষা ও স্থানীয় পরামর্শ নিন।" },
    { heading: "উপকরণ প্রস্তুতি", body: "বীজের লেবেল ও নির্ধারিত বপন পদ্ধতি অনুসরণ করুন। সার বা বালাইনাশকের মাত্রা অনুমান করে প্রয়োগ না করে অনুমোদিত লেবেল ও কৃষি বিশেষজ্ঞের নির্দেশনা যাচাই করুন।" },
  ] },
  "seed-storage": { title: "বীজ সংরক্ষণের সাধারণ নিয়ম", description: "বীজের গুণমান বজায় রাখতে লেবেল ও নিরাপদ সংরক্ষণ সম্পর্কে প্রাথমিক নির্দেশনা।", sections: [
    { heading: "লেবেলের নির্দেশনা আগে", body: "বীজের ধরনভেদে সংরক্ষণ শর্ত আলাদা হতে পারে। প্যাকেটের নির্দেশনা ও সরবরাহকারীর পরামর্শকে অগ্রাধিকার দিন।" },
    { heading: "শুষ্ক ও সুরক্ষিত জায়গা", body: "প্যাকেটকে আর্দ্রতা, সরাসরি রোদ, অতিরিক্ত তাপ, ইঁদুর ও পোকামাকড় থেকে সুরক্ষিত রাখুন। প্যাকেটের মূল লেবেল অক্ষত রাখুন এবং রাসায়নিক বা জ্বালানির পাশে রাখবেন না।" },
    { heading: "পুরোনো বীজ আলাদা করুন", body: "ব্যাচ, কেনার তারিখ ও মেয়াদ লিখে রাখুন। মেয়াদ পেরোনো বা ভেজা/ক্ষতিগ্রস্ত বীজের অঙ্কুরোদ্গম অনুমান না করে প্রয়োজন হলে পরীক্ষা ও স্থানীয় পরামর্শ নিন।" },
  ] },
};

export function generateStaticParams() { return Object.keys(guides).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const guide = guides[slug];
  return guide ? { title: guide.title, description: guide.description, alternates: { canonical: `/guides/${slug}` }, openGraph: { title: guide.title, description: guide.description, locale: "bn_BD", type: "article" } } : { title: "গাইড পাওয়া যায়নি", robots: { index: false, follow: false } };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const guide = guides[slug]; if (!guide) notFound();
  return <main className="min-h-screen bg-[#f5f7f2] px-5 py-12 text-[#17351f]"><article className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-sm md:p-12"><nav className="text-sm"><Link className="underline" href="/guides">বাংলা কৃষি গাইড</Link> / <Link className="underline" href="/marketplace">মার্কেটপ্লেস</Link></nav><p className="mt-6 text-sm font-bold uppercase tracking-widest text-amber-700">AGRIVA কৃষি জ্ঞান</p><h1 className="mt-3 text-3xl font-black md:text-4xl">{guide.title}</h1><p className="mt-4 leading-7 text-slate-600">{guide.description}</p>{guide.sections.map(section=><section key={section.heading} className="mt-8"><h2 className="text-xl font-black">{section.heading}</h2><p className="mt-3 leading-8 text-slate-700">{section.body}</p></section>)}<aside className="mt-10 rounded-xl bg-emerald-50 p-4 text-sm leading-6">এটি সাধারণ শিক্ষামূলক তথ্য, নির্দিষ্ট জমির জন্য কৃষি-পরামর্শ নয়। আপনার এলাকার কৃষি সম্প্রসারণ কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন।</aside><p className="mt-8">প্রাসঙ্গিক পণ্য: <Link href="/marketplace" className="font-bold text-emerald-800 underline">বীজ ও কৃষি উপকরণ দেখুন</Link></p></article></main>;
}
