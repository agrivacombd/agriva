import type { Metadata } from "next";
import Link from "next/link";
import CropCalendar from "@/components/tools/CropCalendar";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "বাংলাদেশ Crop Calendar: ফসল বপন ও কাটার সময়",
  description: "আউশ, আমন, বোরো, গম, রবি ভুট্টা ও আলুর বপন-রোপণ এবং ফসল সংগ্রহের জাতীয় সময়সীমা দেখুন। BBS ও BAMIS-এর উৎসসহ কৃষি পরিকল্পনা করুন।",
  alternates: { canonical: "/tools/crop-calendar" },
  openGraph: {
    title: "বাংলাদেশের ফসল ক্যালেন্ডার | AGRIVA",
    description: "বাংলাদেশে প্রধান ফসলের বপন, রোপণ ও সংগ্রহের সময় জানুন; স্থানীয় BAMIS পরামর্শ দিয়ে সময় যাচাই করুন।",
    url: "/tools/crop-calendar",
    type: "website",
    locale: "bn_BD",
  },
  keywords: [
    "ফসল ক্যালেন্ডার বাংলাদেশ",
    "বাংলাদেশের ফসলের সময়সূচি",
    "ধান রোপণের সময়",
    "আউশ আমন বোরো ধানের সময়",
    "গম বপনের সময়",
    "আলু রোপণের সময়",
    "crop calendar Bangladesh",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl + "/" },
    { "@type": "ListItem", position: 2, name: "কৃষি টুলবক্স", item: siteUrl + "/tools" },
    { "@type": "ListItem", position: 3, name: "ফসল ক্যালেন্ডার", item: siteUrl + "/tools/crop-calendar" },
  ],
};


const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "বাংলাদেশে আমন ধান কখন রোপণ করতে হয়?", acceptedAnswer: { "@type": "Answer", text: "BBS-এর জাতীয় ক্যালেন্ডারে স্থানীয় রোপা আমনের সময় জুনের শেষ থেকে সেপ্টেম্বরের শুরু এবং উচ্চফলনশীল রোপা আমনের সময় জুনের শেষ থেকে আগস্টের মাঝামাঝি দেওয়া আছে। আপনার এলাকার BAMIS ক্যালেন্ডার ও স্থানীয় কৃষি কর্মকর্তার পরামর্শ অনুসরণ করুন।" } },
    { "@type": "Question", name: "আউশ, আমন ও বোরো ধানের সময় কি একই?", acceptedAnswer: { "@type": "Answer", text: "না। তিনটি আলাদা মৌসুমের ধান। বপন বা রোপণ এবং সংগ্রহের সময় আলাদা; আমনের বোনা ও রোপা পদ্ধতির সময়ও এক নয়।" } },
    { "@type": "Question", name: "এই ক্যালেন্ডার কি আমার জেলার নির্দিষ্ট তারিখ দেখায়?", acceptedAnswer: { "@type": "Answer", text: "না। AGRIVA-এর এই টুলে BBS-এর জাতীয় ভিত্তির সময়সীমা দেখানো হয়। জেলা-ভিত্তিক সময় যাচাই করতে BAMIS-এর ফসল আবহাওয়া পঞ্জিকায় আপনার জেলা নির্বাচন করুন।" } },
    { "@type": "Question", name: "ফসল ক্যালেন্ডার কি স্বয়ংক্রিয় রিমাইন্ডার পাঠায়?", acceptedAnswer: { "@type": "Answer", text: "না। এই পেজটি বপন, রোপণ ও সংগ্রহের সময় বোঝার পরিকল্পনা-সহায়ক টুল। কাজের তালিকা ব্রাউজারে সংরক্ষণ করতে আমার ফসল ক্যালেন্ডার ব্যবহার করতে পারেন; সেটিও বর্তমানে ফোনে স্বয়ংক্রিয় নোটিফিকেশন পাঠায় না." } },
  ],
};

export default function CropCalendarPage() {
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
      <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p>
          <h1 className="mt-3 break-words text-3xl font-black leading-tight sm:text-4xl md:text-5xl">বাংলাদেশের ফসল ক্যালেন্ডার</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#647468] sm:text-lg sm:leading-8">
            আউশ, আমন, বোরো, গম, রবি ভুট্টা ও আলুর বপন বা রোপণ এবং ফসল সংগ্রহের সাধারণ সময়সীমা দেখুন।
            ফসল ও মৌসুম নির্বাচন করে পরিকল্পনার তথ্য জানুন।
          </p>
          <CropCalendar />

          <article className="mx-auto mt-12 max-w-4xl rounded-3xl border border-[#e4eadf] bg-white px-6 py-8 text-[16px] leading-8 text-slate-700 shadow-sm sm:px-10 sm:py-10 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:border-l-4 [&_h2]:border-[#2f7d46] [&_h2]:pl-4 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:leading-snug [&_h2]:text-[#17351f] [&_h2:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:leading-7 [&_h3]:text-[#244b31] [&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-8 [&_p]:text-slate-600 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6 [&_li]:pl-1 [&_li]:text-[15px] [&_li]:leading-8 [&_li]:text-slate-600 [&_a]:font-semibold [&_a]:text-emerald-700 [&_a]:underline [&_a]:decoration-emerald-200 [&_a]:underline-offset-4 [&_strong]:font-bold [&_strong]:text-slate-800">
            <h2>বাংলাদেশের ফসল ক্যালেন্ডার কী?</h2>
            <p>
              ফসল ক্যালেন্ডার হলো বছরের কোন সময়ে বীজ বপন, চারা রোপণ ও ফসল সংগ্রহ করা হয় তার একটি
              পরিকল্পনামূলক নির্দেশিকা। বাংলাদেশে একই ফসলের মৌসুম, জাত ও উৎপাদন পদ্ধতি অনুযায়ী সময়
              আলাদা হতে পারে। তাই ধানের ক্ষেত্রে আউশ, আমন ও বোরো আলাদা করে দেখা জরুরি; আমনের বোনা
              ও রোপা পদ্ধতির সময়ও এক নয়।
            </p>

            <h2>প্রধান ফসলের বপন ও সংগ্রহের সময়</h2>
            <p>
              নিচের সময়সীমাগুলো বাংলাদেশ পরিসংখ্যান ব্যুরোর (BBS) Yearbook of Agricultural Statistics
              2022-এর জাতীয় Crop Calendar, পৃষ্ঠা ২৪ থেকে নেওয়া। এগুলো জাতীয় ভিত্তির তথ্য; কোনো নির্দিষ্ট
              জেলা, উপজেলা, জাত বা চলতি বছরের আবহাওয়ার জন্য নিশ্চিত তারিখ নয়।
            </p>
            <ul>
              <li><strong>আউশ ধান:</strong> বপন/রোপণ সাধারণত মার্চের মাঝামাঝি থেকে এপ্রিলের মাঝামাঝি; সংগ্রহ জুলাইয়ের মাঝামাঝি থেকে আগস্টের মধ্যে।</li>
              <li><strong>আমন ধান (রোপা):</strong> স্থানীয় জাতের রোপণ জুনের শেষ থেকে সেপ্টেম্বরের শুরু এবং উচ্চফলনশীল জাতের ক্ষেত্রে জুনের শেষ থেকে আগস্টের মাঝামাঝি; সংগ্রহ ডিসেম্বর থেকে জানুয়ারির শুরু।</li>
              <li><strong>আমন ধান (বোনা):</strong> স্থানীয় বোনা আমনের বপন মার্চের মাঝামাঝি থেকে এপ্রিলের মাঝামাঝি; সংগ্রহ নভেম্বরের মাঝামাঝি থেকে ডিসেম্বরের মাঝামাঝি।</li>
              <li><strong>বোরো ধান:</strong> স্থানীয় জাতের বপন/রোপণ নভেম্বরের মাঝামাঝি থেকে জানুয়ারির মাঝামাঝি; উচ্চফলনশীল ও হাইব্রিডের ক্ষেত্রে ডিসেম্বর থেকে ফেব্রুয়ারির মাঝামাঝি। সংগ্রহের সময়ও জাতভেদে এপ্রিল–জুনের মধ্যে।</li>
              <li><strong>গম:</strong> বপন নভেম্বর–ডিসেম্বর; সংগ্রহ মার্চ থেকে এপ্রিলের মাঝামাঝি।</li>
              <li><strong>রবি ভুট্টা:</strong> বপন অক্টোবরের মাঝামাঝি থেকে ডিসেম্বরের শেষ; সংগ্রহ এপ্রিলের শুরু থেকে মে মাসের শেষ।</li>
              <li><strong>আলু:</strong> রোপণ সেপ্টেম্বরের মাঝামাঝি থেকে নভেম্বর; সংগ্রহ জানুয়ারির মাঝামাঝি থেকে মার্চ।</li>
            </ul>

            <h2>জেলা অনুযায়ী ফসলের সময় কীভাবে যাচাই করবেন?</h2>
            <p>
              জাতীয় ক্যালেন্ডার দিয়ে প্রাথমিক পরিকল্পনা করুন, কিন্তু চূড়ান্ত বপন বা রোপণের তারিখ ঠিক করার আগে
              এলাকার কৃষি আবহাওয়া ও কৃষি সম্প্রসারণ অধিদপ্তরের পরামর্শ দেখুন। BAMIS-এর ফসল আবহাওয়া
              পঞ্জিকায় ধান আমন, ধান আউশ, ধান বোরো, রবি ভুট্টা, খরিফ-১ ভুট্টা, গম, আলু এবং বিভিন্ন সবজির
              আলাদা ক্যালেন্ডার রয়েছে। সেখানে জেলা নির্বাচন করে স্থানীয় তথ্য যাচাই করা যায়।
            </p>
            <p>
              উদাহরণ হিসেবে, <a href="https://www.bamis.gov.bd/calendar/1/74/6/" target="_blank" rel="noopener noreferrer">দিনাজপুরের আমন ধানের পঞ্জিকা</a>
              এবং <a href="https://www.bamis.gov.bd/calendar/1/75/6/" target="_blank" rel="noopener noreferrer">দিনাজপুরের বোরো ধানের পঞ্জিকা</a>
              পাওয়া যায়। BAMIS-এর পৃষ্ঠায় ক্যালেন্ডারের কিছু তথ্য ইন্টার‌্যাকটিভভাবে লোড হয়; তাই এই পেজে
              সেগুলোর নির্দিষ্ট তারিখ কপি করে জাতীয় সময়সীমা হিসেবে দেখানো হয়নি।
            </p>

            <h2>ফসলের সময়সূচি বদলে যাওয়ার কারণ</h2>
            <ul>
              <li>জেলা, উপজেলা, জমির উচ্চতা ও পানি নিষ্কাশনের অবস্থা।</li>
              <li>ফসলের জাত, বীজের বৈশিষ্ট্য ও বপন/রোপণ পদ্ধতি।</li>
              <li>বৃষ্টিপাত, তাপমাত্রা, বন্যা, খরা ও অন্যান্য আবহাওয়াগত অবস্থা।</li>
              <li>সেচ, জমি প্রস্তুতি, শ্রমিক ও কৃষি উপকরণের প্রাপ্যতা।</li>
            </ul>

            <h2>ফসল ক্যালেন্ডার ব্যবহার করে কীভাবে পরিকল্পনা করবেন?</h2>
            <ol>
              <li>আপনার জমি ও এলাকার উপযোগী ফসল এবং জাত নির্বাচন করুন।</li>
              <li>BBS-এর জাতীয় সময়সীমা দেখে প্রাথমিক পরিকল্পনা করুন।</li>
              <li>BAMIS-এর জেলা-ভিত্তিক ফসল আবহাওয়া পঞ্জিকা এবং স্থানীয় কৃষি কর্মকর্তার পরামর্শ দিয়ে তারিখ যাচাই করুন।</li>
              <li>বীজ, সার, সেচ, শ্রমিক ও বাজারজাতকরণের প্রস্তুতি আগেই নিন।</li>
              <li>আবহাওয়া বা মাঠের অবস্থার পরিবর্তন হলে পরিকল্পনা সংশোধন করুন।</li>
            </ol>

            <h2>সম্পর্কিত AGRIVA টুল ও গাইড</h2>
            <ul>
              <li><Link href="/crop-calendar">আমার ফসল ক্যালেন্ডার</Link> — ব্রাউজারে সংরক্ষিত ফসলভিত্তিক কাজের চেকলিস্ট। এটি স্বয়ংক্রিয় তারিখভিত্তিক নোটিফিকেশন পাঠায় না।</li>
              <li><Link href="/seed-rate-calculator">বীজের পরিমাণ হিসাব</Link> — যাচাই করা বীজের হার দিয়ে জমির জন্য প্রয়োজনীয় বীজের পরিমাণ হিসাব করুন।</li>
              <li><Link href="/fertilizer-calculator">সার হিসাব ক্যালকুলেটর</Link> — মাটি পরীক্ষা বা স্থানীয় সুপারিশ থেকে পাওয়া সারের হার দিয়ে পরিমাণ হিসাব করুন।</li>
              <li><Link href="/blog/dhan-chash-poddhoti">ধান চাষ পদ্ধতি</Link> — ধান চাষের বিস্তারিত নির্দেশিকা পড়ুন।</li>
              <li><Link href="/blog/winter-vegetable-seed-sowing-calendar">শীতকালীন সবজির বীজ বপন ক্যালেন্ডার</Link> — শীতকালীন সবজি নিয়ে বিস্তারিত পড়ুন।</li>
            </ul>

            <h2>ফসল ক্যালেন্ডার নিয়ে সাধারণ প্রশ্ন</h2>
            <h3>বাংলাদেশে আমন ধান কখন রোপণ করতে হয়?</h3>
            <p>
              BBS-এর জাতীয় ক্যালেন্ডারে স্থানীয় রোপা আমনের সময় জুনের শেষ থেকে সেপ্টেম্বরের শুরু এবং
              উচ্চফলনশীল রোপা আমনের সময় জুনের শেষ থেকে আগস্টের মাঝামাঝি দেওয়া আছে। আপনার এলাকার
              BAMIS ক্যালেন্ডার ও স্থানীয় কৃষি কর্মকর্তার পরামর্শ অনুসরণ করুন।
            </p>
            <h3>আউশ, আমন ও বোরো ধানের সময় কি একই?</h3>
            <p>
              না। তিনটি আলাদা মৌসুমের ধান। বপন বা রোপণ এবং সংগ্রহের সময় আলাদা; আমনের বোনা ও রোপা
              পদ্ধতির সময়ও এক নয়।
            </p>
            <h3>এই ক্যালেন্ডার কি আমার জেলার নির্দিষ্ট তারিখ দেখায়?</h3>
            <p>
              না। AGRIVA-এর এই টুলে BBS-এর জাতীয় ভিত্তির সময়সীমা দেখানো হয়। জেলা-ভিত্তিক সময় যাচাই করতে
              BAMIS-এর ফসল আবহাওয়া পঞ্জিকায় আপনার জেলা নির্বাচন করুন।
            </p>
            <h3>ফসল ক্যালেন্ডার কি স্বয়ংক্রিয় রিমাইন্ডার পাঠায়?</h3>
            <p>
              না। এই পেজটি বপন, রোপণ ও সংগ্রহের সময় বোঝার পরিকল্পনা-সহায়ক টুল। কাজের তালিকা ব্রাউজারে
              সংরক্ষণ করতে <Link href="/crop-calendar">আমার ফসল ক্যালেন্ডার</Link> ব্যবহার করতে পারেন;
              সেটিও বর্তমানে ফোনে স্বয়ংক্রিয় নোটিফিকেশন পাঠায় না।
            </p>

            <h2>তথ্যসূত্র</h2>
            <ul>
              <li><a href="https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bbs/2024/12/85216bc379fa443e837ffac3052a45dc.pdf" target="_blank" rel="noopener noreferrer">Bangladesh Bureau of Statistics (BBS), Yearbook of Agricultural Statistics 2022 — Crop Calendar of Bangladesh, পৃষ্ঠা ২৪</a>.</li>
              <li><a href="https://www.bamis.gov.bd/en/calendar/" target="_blank" rel="noopener noreferrer">Bangladesh Agro-Meteorological Information Service (BAMIS), Department of Agricultural Extension — Crop Weather Calendar</a>.</li>
              <li><a href="https://www.bamis.gov.bd/en/page/about-bamis-portal/" target="_blank" rel="noopener noreferrer">BAMIS Portal সম্পর্কে — কৃষি আবহাওয়া ও জেলা-ভিত্তিক পরামর্শ সেবা</a>.</li>
            </ul>
            <p><strong>তথ্য ব্যবহারের নোট:</strong> BBS-এর প্রকাশিত জাতীয় সময়সীমা পরিকল্পনার ভিত্তি হিসেবে ব্যবহৃত হয়েছে। নির্দিষ্ট জমিতে চাষের সিদ্ধান্তের আগে হালনাগাদ জেলা-ভিত্তিক কৃষি আবহাওয়া পরামর্শ যাচাই করুন।</p>
          </article>
        </section>
      </main>
    </>
  );
}
