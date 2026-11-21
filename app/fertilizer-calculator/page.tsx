import type { Metadata } from "next";
import Link from "next/link";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\\/$/, "");

export const metadata: Metadata = {
  title: "সার হিসাব ক্যালকুলেটর: জমি অনুযায়ী সারের পরিমাণ | AGRIVA",
  description: "একর, হেক্টর বা শতক ও প্রতি একরের নির্ধারিত সারের হার দিয়ে প্রয়োজনীয় পরিমাণ হিসাব করুন। মাটি পরীক্ষা ও BARC নির্দেশিকা থেকে সঠিক হার যাচাই করুন।",
  alternates: {
    canonical: "/fertilizer-calculator",
    languages: {
      "bn-BD": "/fertilizer-calculator",
      en: "/en/fertilizer-calculator",
      "x-default": "/fertilizer-calculator",
    },
  },
  openGraph: {
    title: "সার হিসাব ক্যালকুলেটর | AGRIVA",
    description: "জমির আয়তন ও আপনার নির্ধারিত সারের হার দিয়ে মোট প্রয়োজনীয় পরিমাণ হিসাব করুন।",
    url: "/fertilizer-calculator",
    type: "website",
    locale: "bn_BD",
  },
  keywords: [
    "সার হিসাব",
    "সার হিসাব ক্যালকুলেটর",
    "জমি অনুযায়ী সারের পরিমাণ",
    "প্রতি একরে সারের হিসাব",
    "fertilizer quantity calculator",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl + "/" },
    { "@type": "ListItem", position: 2, name: "কৃষি ক্যালকুলেটর", item: siteUrl + "/agriculture-calculators" },
    { "@type": "ListItem", position: 3, name: "সার হিসাব ক্যালকুলেটর", item: siteUrl + "/fertilizer-calculator" },
  ],
};

export default function FertilizerCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <StandaloneCalculator kind="fertilizer" locale="bn" />
      <article className="prose prose-green mx-auto mt-10 max-w-4xl px-4 pb-12 sm:px-6">
        <h2>সার হিসাব ক্যালকুলেটর কীভাবে কাজ করে?</h2>
        <p>
          জমির পরিমাণ এবং প্রতি একরে আপনার জানা সারের হার লিখুন। ক্যালকুলেটর জমির একককে একরে রূপান্তর করে
          মোট প্রয়োজনীয় পরিমাণ দেখায়। এখানে সারের হার আপনাকেই মাটি পরীক্ষার রিপোর্ট বা নির্ভরযোগ্য স্থানীয়
          সুপারিশ থেকে দিতে হবে; AGRIVA এই ক্যালকুলেটরে নিজে থেকে কোনো সার প্রয়োগের মাত্রা নির্ধারণ করে না।
        </p>

        <h3>সারের পরিমাণ হিসাবের সূত্র</h3>
        <p><strong>মোট সারের পরিমাণ = জমির পরিমাণ (একর) × প্রতি একরে সারের হার (কেজি)</strong></p>
        <p>
          উদাহরণ হিসেবে, আপনার নির্ভরযোগ্য সুপারিশে প্রতি একরে ৩০ কেজি সারের হার থাকলে এবং জমি ০.৫ একর
          হলে হিসাব হবে ০.৫ × ৩০ = ১৫ কেজি। এটি শুধু গণনার উদাহরণ—কোনো ফসলের জন্য ৩০ কেজি প্রয়োগের
          সুপারিশ নয়।
        </p>

        <h3>একর, হেক্টর ও শতক দিয়ে হিসাব</h3>
        <ul>
          <li>একর নির্বাচন করলে জমির পরিমাণ সরাসরি একরে লিখুন।</li>
          <li>হেক্টর নির্বাচন করলে ক্যালকুলেটর একরে রূপান্তর করে হিসাব করে।</li>
          <li>শতক নির্বাচন করলে ১০০ শতককে ১ একর ধরে হিসাব করা হয়।</li>
        </ul>
        <p>
          মনে রাখবেন, এই টুলে সারের হার সবসময় কেজি/একর হিসেবে দিতে হবে—জমির একক হেক্টর বা শতক হলেও।
        </p>

        <h3>সঠিক সারের হার কোথা থেকে নেবেন?</h3>
        <p>
          ফসল, জাত, মাটির উর্বরতা, এলাকার কৃষি-পরিবেশ ও উৎপাদন লক্ষ্যমাত্রা অনুযায়ী সারের সুপারিশ বদলায়।
          সম্ভব হলে মাটি পরীক্ষা করান এবং স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন। বাংলাদেশ কৃষি গবেষণা
          কাউন্সিলের (BARC) <a href="https://apps.barc.gov.bd/fertilizer_recommendation/FRG%20English%2030.10.2024.pdf" target="_blank" rel="noopener noreferrer">Fertilizer Recommendation Guide-2024</a>
          এবং <a href="https://portal.cropzoning.gov.bd/" target="_blank" rel="noopener noreferrer">BARC কৃষি পরামর্শক বাতায়ন</a>
          থেকে ফসল ও এলাকার উপযোগী নির্দেশনা যাচাই করতে পারেন।
        </p>

        <h3>এই ক্যালকুলেটরের সীমাবদ্ধতা</h3>
        <p>
          এটি জমির আয়তন ও আপনার দেওয়া হার থেকে একটি সারের মোট পরিমাণ হিসাব করে। এটি মাটির পুষ্টি পরীক্ষা,
          N-P-K চাহিদা নির্ধারণ, সারের ধরন নির্বাচন বা প্রয়োগের সময়সূচি তৈরি করে না। ইউরিয়া, TSP, MOP
          বা অন্য পণ্যের হার আলাদা হলে প্রতিটির জন্য সংশ্লিষ্ট নির্ভরযোগ্য হার ব্যবহার করুন।
        </p>

        <h3>সম্পর্কিত AGRIVA টুল</h3>
        <ul>
          <li><Link href="/soil-fertilizer">মাটি ও সার পরিকল্পনাকারী</Link> — মাটি পরীক্ষার রিপোর্টে দেওয়া N, P₂O₅ ও K₂O-এর হার থেকে ইউরিয়া, TSP ও MOP-এর আনুমানিক পরিমাণ হিসাব করতে।</li>
          <li><Link href="/agriculture-calculators">সব কৃষি ক্যালকুলেটর</Link> — বীজ, চাষের খরচ ও অন্যান্য কৃষি হিসাবের টুল দেখতে।</li>
        </ul>

        <h2>সার হিসাব নিয়ে সাধারণ প্রশ্ন</h2>
        <h3>এই ক্যালকুলেটর কি আমার ফসলের জন্য সঠিক সারের মাত্রা বলে?</h3>
        <p>
          না। এটি আপনার দেওয়া হার অনুযায়ী পরিমাণ হিসাব করে। ফসল ও জমির জন্য সঠিক হার মাটি পরীক্ষা,
          BARC-এর নির্দেশিকা এবং স্থানীয় কৃষি কর্মকর্তার পরামর্শ থেকে যাচাই করুন।
        </p>
        <h3>জমি শতকে দিলে সারের হার কীভাবে লিখব?</h3>
        <p>
          জমির একক হিসেবে শতক নির্বাচন করুন, কিন্তু সারের হার কেজি/একর হিসেবে লিখুন। উদাহরণস্বরূপ,
          ৫০ শতক জমি ০.৫ একরের সমান।
        </p>
        <h3>মাটি পরীক্ষা ছাড়া কি সারের হার ব্যবহার করা যাবে?</h3>
        <p>
          মাটি পরীক্ষা সবচেয়ে ভালো ভিত্তি। পরীক্ষা না থাকলে BARC-এর নির্দেশিকায় এলাকার ফসল বিন্যাসভিত্তিক
          সুপারিশ দেখুন এবং স্থানীয় কৃষি কর্মকর্তার সঙ্গে মিলিয়ে নিন। এক এলাকার বা এক ফসলের হার অন্য
          জমিতে সরাসরি প্রয়োগ করবেন না।
        </p>
      </article>
    </>
  );
}
