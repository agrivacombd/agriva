import type { Metadata } from "next";
import Link from "next/link";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "বীজের পরিমাণ হিসাব ক্যালকুলেটর: জমি অনুযায়ী বীজ",
  description: "একর, হেক্টর বা শতক অনুযায়ী জমির পরিমাণ ও প্রতি একরের বীজের হার দিয়ে প্রয়োজনীয় বীজ হিসাব করুন। ফসল, জাত ও বপন পদ্ধতির হার যাচাই করুন।",
  alternates: {
    canonical: "/seed-rate-calculator",
    languages: {
      "bn-BD": "/seed-rate-calculator",
      en: "/en/seed-rate-calculator",
      "x-default": "/seed-rate-calculator",
    },
  },
  openGraph: {
    title: "বীজের পরিমাণ হিসাব ক্যালকুলেটর | AGRIVA",
    description: "জমির আয়তন ও আপনার নির্ধারিত বীজের হার দিয়ে আনুমানিক প্রয়োজনীয় বীজ হিসাব করুন।",
    url: "/seed-rate-calculator",
    type: "website",
    locale: "bn_BD",
  },
  keywords: [
    "বীজের পরিমাণ হিসাব",
    "বীজের হার ক্যালকুলেটর",
    "জমি অনুযায়ী বীজ",
    "প্রতি একরে বীজের হিসাব",
    "seed quantity calculator Bangladesh",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl + "/" },
    { "@type": "ListItem", position: 2, name: "কৃষি ক্যালকুলেটর", item: siteUrl + "/agriculture-calculators" },
    { "@type": "ListItem", position: 3, name: "বীজের পরিমাণ হিসাব", item: siteUrl + "/seed-rate-calculator" },
  ],
};


const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "এই ক্যালকুলেটর কি ধান, গম ও সবজির বীজের হার নিজে থেকে বলে?", acceptedAnswer: { "@type": "Answer", text: "না। ফসল ও পদ্ধতির জন্য যাচাই করা বীজের হার আপনাকে লিখতে হবে। BARC কৃষি পরামর্শক বাতায়ন এবং স্থানীয় কৃষি কর্মকর্তার নির্দেশনা থেকে হার যাচাই করুন।" } },
    { "@type": "Question", name: "জমি শতকে দিলে বীজের হার কীভাবে লিখব?", acceptedAnswer: { "@type": "Answer", text: "জমির একক হিসেবে শতক নির্বাচন করুন, কিন্তু বীজের হার কেজি/একর হিসেবে লিখুন। উদাহরণস্বরূপ, ৫০ শতক জমি ০.৫ একরের সমান।" } },
    { "@type": "Question", name: "বীজের হার কি অঙ্কুরোদ্গমের ওপর নির্ভর করে?", acceptedAnswer: { "@type": "Answer", text: "হ্যাঁ। বীজের মান ও অঙ্কুরোদ্গম, জাত, বপন পদ্ধতি এবং মাঠের অবস্থার কারণে প্রয়োজনীয় বীজের পরিমাণ বদলাতে পারে। কম অঙ্কুরোদ্গমের বীজ ব্যবহার করার আগে স্থানীয় কৃষি পরামর্শ নিন." } },
  ],
};

export default function SeedRateCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <StandaloneCalculator kind="seed" locale="bn" />
      <article className="mx-auto mt-8 sm:mt-10 lg:mt-12 max-w-4xl min-w-0 break-words [overflow-wrap:anywhere] rounded-2xl sm:rounded-3xl border border-[#e4eadf] bg-white px-4 py-6 text-[15px] leading-7 text-slate-700 shadow-sm sm:px-7 sm:py-8 sm:text-base sm:leading-8 lg:px-10 lg:py-10 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:border-l-4 [&_h2]:border-[#2f7d46] [&_h2]:pl-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:leading-snug [&_h2]:text-[#17351f] sm:[&_h2]:mb-4 sm:[&_h2]:mt-10 sm:[&_h2]:pl-4 sm:[&_h2]:text-2xl [&_h2:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:leading-7 [&_h3]:text-[#244b31] sm:[&_h3]:mt-7 sm:[&_h3]:text-lg [&_p]:my-3 [&_p]:text-sm [&_p]:leading-7 [&_p]:text-slate-600 sm:[&_p]:my-4 sm:[&_p]:text-[15px] sm:[&_p]:leading-8 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 sm:[&_ul]:my-5 sm:[&_ul]:space-y-3 sm:[&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 sm:[&_ol]:my-5 sm:[&_ol]:space-y-3 sm:[&_ol]:pl-6 [&_li]:pl-1 [&_li]:text-sm [&_li]:leading-7 [&_li]:text-slate-600 sm:[&_li]:text-[15px] sm:[&_li]:leading-8 [&_a]:break-words [&_a]:font-semibold [&_a]:text-emerald-700 [&_a]:underline [&_a]:decoration-emerald-200 [&_a]:underline-offset-4 [&_strong]:font-bold [&_strong]:text-slate-800">
        <h2>বীজের প্রয়োজনীয় পরিমাণ কীভাবে হিসাব করবেন?</h2>
        <p>
          জমির পরিমাণ এবং আপনার ফসল, জাত ও বপন পদ্ধতির জন্য প্রযোজ্য প্রতি একরের বীজের হার লিখুন।
          ক্যালকুলেটর জমির একককে একরে রূপান্তর করে মোট বীজের পরিমাণ দেখায়। এখানে বীজের হার আপনাকেই
          নির্ভরযোগ্য কৃষি নির্দেশনা বা স্থানীয় সুপারিশ থেকে দিতে হবে; AGRIVA নিজে থেকে কোনো ফসলের
          বীজের হার নির্ধারণ করে না।
        </p>

        <h3>বীজের পরিমাণ হিসাবের সূত্র</h3>
        <p><strong>মোট বীজ = জমির পরিমাণ (একর) × প্রতি একরে বীজের হার (কেজি)</strong></p>
        <p>
          উদাহরণ হিসেবে, কোনো নির্দিষ্ট ফসল ও পদ্ধতির জন্য আপনার যাচাই করা হার যদি ৮ কেজি/একর হয়,
          তাহলে ০.৫ একর জমির জন্য হিসাব হবে ০.৫ × ৮ = ৪ কেজি। এটি শুধু গাণিতিক উদাহরণ—কোনো ফসলের
          জন্য ৮ কেজি/একর বীজ ব্যবহারের সুপারিশ নয়।
        </p>

        <h3>একর, হেক্টর ও শতক দিয়ে বীজের হিসাব</h3>
        <ul>
          <li>একর নির্বাচন করলে জমির পরিমাণ একরে লিখুন।</li>
          <li>হেক্টর নির্বাচন করলে ক্যালকুলেটর জমিকে একরে রূপান্তর করে হিসাব করে।</li>
          <li>শতক নির্বাচন করলে ১০০ শতককে ১ একর ধরে হিসাব করা হয়।</li>
        </ul>
        <p>
          জমির একক যেটিই নির্বাচন করুন, বীজের হার লিখতে হবে কেজি/একর হিসেবে। বীজের হার কেজি/হেক্টর
          হিসেবে দেওয়া থাকলে আগে একক রূপান্তর করে নিন।
        </p>

        <h3>কেন সব ফসলের বীজের হার এক নয়?</h3>
        <p>
          বীজের প্রয়োজন ফসল ও জাত, সরাসরি বপন নাকি বীজতলায় চারা তৈরি, রোপণ পদ্ধতি, বপনের দূরত্ব,
          অঙ্কুরোদ্গমের হার এবং মৌসুমের ওপর নির্ভর করে। একই ফসলের ক্ষেত্রেও পদ্ধতি বদলালে বীজের
          প্রয়োজন বদলাতে পারে। তাই সবজি, ধান বা গমের জন্য একটি সাধারণ হার ব্যবহার করা ঠিক নয়।
        </p>

        <h3>বিশ্বস্ত বীজের হার কোথা থেকে যাচাই করবেন?</h3>
        <p>
          বাংলাদেশ কৃষি গবেষণা কাউন্সিলের (BARC) কৃষি পরামর্শক বাতায়নে ফসলভিত্তিক উৎপাদন প্রযুক্তি ও
          বীজের হার দেওয়া আছে। যেমন, <a href="https://portal.cropzoning.gov.bd/CropInfo/ProductionTechs?c=3" target="_blank" rel="noopener noreferrer">BRRI dhan29-এর উৎপাদন প্রযুক্তি</a>,
          <a href="https://portal.cropzoning.gov.bd/CropInfo/ProductionTechs?c=27" target="_blank" rel="noopener noreferrer">ঢেঁড়সের উৎপাদন প্রযুক্তি</a> এবং
          <a href="https://portal.cropzoning.gov.bd/CropInfo/ProductionTechs?c=43" target="_blank" rel="noopener noreferrer">শসার উৎপাদন প্রযুক্তি</a>
          থেকে সংশ্লিষ্ট ফসলের নির্দেশনা দেখুন। আপনার জাত, এলাকা ও বপন পদ্ধতির সঙ্গে তথ্য মিলিয়ে নিন।
        </p>

        <h3>বীজ কেনার আগে যা যাচাই করবেন</h3>
        <ul>
          <li>বীজের ফসল ও জাত আপনার এলাকার মৌসুমের উপযোগী কি না।</li>
          <li>প্যাকেটে অঙ্কুরোদ্গমের হার, উৎপাদন/মেয়াদোত্তীর্ণের তারিখ ও লট নম্বর আছে কি না।</li>
          <li>বীজ প্রত্যয়িত বা বিশ্বস্ত উৎস থেকে সংগ্রহ করা হচ্ছে কি না।</li>
          <li>আপনার বপন বা চারা রোপণ পদ্ধতির জন্য নির্ধারিত হার ব্যবহার করছেন কি না।</li>
        </ul>

        <h3>এই ক্যালকুলেটরের সীমাবদ্ধতা</h3>
        <p>
          এটি শুধু আপনার দেওয়া জমির পরিমাণ ও বীজের হার থেকে প্রয়োজনীয় পরিমাণ এবং ঐচ্ছিক বীজের বাজেট
          হিসাব করে। এটি বীজের জাত নির্বাচন, অঙ্কুরোদ্গম পরীক্ষা বা কৃষি সুপারিশের বিকল্প নয়। জমির
          একক ও বীজের হারের একক এক ভিত্তিতে না হলে ফল ভুল হতে পারে।
        </p>

        <h3>সম্পর্কিত AGRIVA টুল</h3>
        <ul>
          <li><Link href="/tools/crop-calendar">ফসলের মৌসুমি ক্যালেন্ডার</Link> — ফসলের পরিকল্পনা ও মৌসুমি কাজের সময় দেখতে।</li>
          <li><Link href="/agriculture-calculators">সব কৃষি ক্যালকুলেটর</Link> — সার, বীজ, চাষের খরচ ও লাভের হিসাবের টুল খুঁজতে।</li>
        </ul>

        <h2>বীজের হিসাব নিয়ে সাধারণ প্রশ্ন</h2>
        <h3>এই ক্যালকুলেটর কি ধান, গম ও সবজির বীজের হার নিজে থেকে বলে?</h3>
        <p>
          না। ফসল ও পদ্ধতির জন্য যাচাই করা বীজের হার আপনাকে লিখতে হবে। BARC কৃষি পরামর্শক বাতায়ন
          এবং স্থানীয় কৃষি কর্মকর্তার নির্দেশনা থেকে হার যাচাই করুন।
        </p>
        <h3>জমি শতকে দিলে বীজের হার কীভাবে লিখব?</h3>
        <p>
          জমির একক হিসেবে শতক নির্বাচন করুন, কিন্তু বীজের হার কেজি/একর হিসেবে লিখুন। উদাহরণস্বরূপ,
          ৫০ শতক জমি ০.৫ একরের সমান।
        </p>
        <h3>বীজের হার কি অঙ্কুরোদ্গমের ওপর নির্ভর করে?</h3>
        <p>
          হ্যাঁ। বীজের মান ও অঙ্কুরোদ্গম, জাত, বপন পদ্ধতি এবং মাঠের অবস্থার কারণে প্রয়োজনীয় বীজের
          পরিমাণ বদলাতে পারে। কম অঙ্কুরোদ্গমের বীজ ব্যবহার করার আগে স্থানীয় কৃষি পরামর্শ নিন।
        </p>
      </article>
    </>
  );
}
