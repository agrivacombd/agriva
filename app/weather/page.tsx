import type { Metadata } from "next";
import Link from "next/link";
import WeatherPanel from "@/components/weather/WeatherPanel";

const pageUrl = "https://agriva.com.bd/weather";

const faqs = [
  {
    question: "AGRIVA-তে কোন কোন এলাকার আবহাওয়া দেখা যায়?",
    answer:
      "বর্তমানে আবহাওয়া প্যানেলে ঢাকা, রাজশাহী, নওগাঁ, রংপুর, ময়মনসিংহ, খুলনা, বরিশাল, চট্টগ্রাম, সিলেট ও কুমিল্লা—এই ১০টি নির্বাচিত এলাকার তথ্য দেখা যায়। তালিকা থেকে এলাকা বেছে নিয়ে আবহাওয়া দেখুন।",
  },
  {
    question: "AGRIVA আবহাওয়ার তথ্য কোথা থেকে নেয়?",
    answer:
      "প্যানেলটি Open-Meteo API থেকে বর্তমান আবহাওয়া ও দৈনিক পূর্বাভাস আনে। সরকারি সতর্কতা ও কৃষি-নির্দিষ্ট পরামর্শের জন্য বাংলাদেশ আবহাওয়া অধিদপ্তর (BMD) এবং কৃষি আবহাওয়া তথ্য সেবা (BAMIS)-এর বুলেটিনও যাচাই করুন।",
  },
  {
    question: "আগামী কত দিনের আবহাওয়ার পূর্বাভাস দেখা যায়?",
    answer:
      "এখানে নির্বাচিত এলাকার বর্তমান অবস্থা এবং আগামী ৫ দিনের দৈনিক পূর্বাভাস দেখানো হয়। প্রতিদিনের সর্বনিম্ন ও সর্বোচ্চ তাপমাত্রা, বৃষ্টির সম্ভাবনা এবং আবহাওয়ার অবস্থা দেখা যায়।",
  },
  {
    question: "বৃষ্টির সম্ভাবনা দেখলে কি সেচ বন্ধ রাখতে হবে?",
    answer:
      "শুধু বৃষ্টির সম্ভাবনা দেখে সেচ বন্ধ করবেন না। বৃষ্টির সম্ভাবনা ও পরিমাণ, জমির আর্দ্রতা, মাটির ধরন, ফসলের বৃদ্ধি পর্যায় এবং জমির পানি নিষ্কাশনের অবস্থা একসঙ্গে বিবেচনা করুন।",
  },
  {
    question: "আবহাওয়ার পূর্বাভাস দেখে কখন বালাইনাশক স্প্রে করা উচিত?",
    answer:
      "পূর্বাভাস একা স্প্রে করার অনুমতি দেয় না। বাতাসের গতি, বৃষ্টি, তাপমাত্রা, পণ্যের লেবেল, ফসলের অবস্থা ও স্থানীয় কৃষি কর্মকর্তার পরামর্শ যাচাই করুন। বৃষ্টি বা ঝোড়ো বাতাসের সময় স্প্রে করলে কার্যকারিতা কমতে পারে এবং ছড়িয়ে পড়ার ঝুঁকি থাকে।",
  },
  {
    question: "AGRIVA-র পূর্বাভাস কি সরকারি সতর্কতার বিকল্প?",
    answer:
      "না। এটি পরিকল্পনায় সহায়ক সাধারণ আবহাওয়া তথ্য। ঘূর্ণিঝড়, বজ্রপাত, বন্যা, তাপপ্রবাহ বা ভারী বৃষ্টির মতো ঝুঁকিতে BMD, BAMIS এবং সংশ্লিষ্ট সরকারি কর্তৃপক্ষের সর্বশেষ সতর্কতা অনুসরণ করুন।",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": pageUrl + "#webpage",
      url: pageUrl,
      name: "বাংলাদেশের কৃষি আবহাওয়া ও ৫ দিনের পূর্বাভাস",
      description:
        "নির্বাচিত এলাকার বর্তমান আবহাওয়া, তাপমাত্রা, আর্দ্রতা, বৃষ্টিপাত ও ৫ দিনের পূর্বাভাস দেখে কৃষিকাজ পরিকল্পনা করুন।",
      inLanguage: "bn-BD",
      isPartOf: { "@id": "https://agriva.com.bd/#website" },
      breadcrumb: { "@id": pageUrl + "#breadcrumb" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": pageUrl + "#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: "https://agriva.com.bd/" },
        { "@type": "ListItem", position: 2, name: "কৃষি আবহাওয়া", item: pageUrl },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": pageUrl + "#faq",
      inLanguage: "bn-BD",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export const metadata: Metadata = {
  title: "কৃষি আবহাওয়া ও ৫ দিনের পূর্বাভাস | AGRIVA বাংলাদেশ",
  description:
    "বাংলাদেশের নির্বাচিত ১০টি এলাকার বর্তমান আবহাওয়া, তাপমাত্রা, আর্দ্রতা, বৃষ্টিপাত ও ৫ দিনের পূর্বাভাস দেখুন। সেচ, স্প্রে ও ফসল কাটার পরিকল্পনায় কৃষি আবহাওয়ার তথ্য ব্যবহার করুন।",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "কৃষি আবহাওয়া ও ৫ দিনের পূর্বাভাস | AGRIVA",
    description:
      "এলাকাভিত্তিক আবহাওয়ার তথ্য ও ৫ দিনের পূর্বাভাস দেখে সেচ, মাঠের কাজ এবং ফসল সংগ্রহের পরিকল্পনা করুন।",
    url: pageUrl,
    siteName: "AGRIVA",
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "কৃষি আবহাওয়া ও ৫ দিনের পূর্বাভাস | AGRIVA",
    description:
      "বাংলাদেশের নির্বাচিত এলাকার আবহাওয়া ও ৫ দিনের পূর্বাভাস—কৃষিকাজ পরিকল্পনার জন্য।",
  },
  robots: { index: true, follow: true },
  keywords: [
    "বাংলাদেশের আবহাওয়া",
    "কৃষি আবহাওয়া",
    "৫ দিনের আবহাওয়ার পূর্বাভাস",
    "জেলার আবহাওয়া",
    "বৃষ্টির সম্ভাবনা",
    "কৃষিকাজের আবহাওয়া",
    "সেচ পরিকল্পনা",
  ],
};

export default function WeatherPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <WeatherPanel />

      <section className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-700">
            AGRIVA · কৃষি আবহাওয়া গাইড
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
            আবহাওয়ার পূর্বাভাস দেখে কৃষিকাজের পরিকল্পনা করুন
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            বৃষ্টি, তাপমাত্রা, আর্দ্রতা ও বাতাসের পরিবর্তন জমির কাজ, সেচ, ফসল সংগ্রহ
            এবং রোগ-পোকা ব্যবস্থাপনায় প্রভাব ফেলতে পারে। AGRIVA-র আবহাওয়া প্যানেলে
            নির্বাচিত এলাকার বর্তমান অবস্থা ও আগামী ৫ দিনের পূর্বাভাস দেখে কাজের
            সময় পরিকল্পনা করতে পারবেন। আবহাওয়ার পূর্বাভাস সম্ভাবনাভিত্তিক—মাঠের
            বাস্তব অবস্থা ও সরকারি সতর্কতার সঙ্গে মিলিয়ে সিদ্ধান্ত নিন।
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["বৃষ্টির সম্ভাবনা", "বৃষ্টির পূর্বাভাস ও সম্ভাব্য পরিমাণ দেখে সেচের প্রয়োজন নতুন করে যাচাই করুন। জমির পানি নিষ্কাশনের ব্যবস্থাও খেয়াল রাখুন।"],
              ["সর্বোচ্চ ও সর্বনিম্ন তাপমাত্রা", "তাপমাত্রার ওঠানামা ফসলের পানি চাহিদা, চারা রোপণ, ফুল-ফল ধারণ এবং শ্রমিকের মাঠে কাজের সময় বিবেচনায় সাহায্য করে।"],
              ["আপেক্ষিক আর্দ্রতা", "উচ্চ আর্দ্রতা কিছু ছত্রাকজনিত রোগের অনুকূল পরিবেশ তৈরি করতে পারে। তবে শুধু আর্দ্রতা দেখে রোগ নিশ্চিত করা যায় না—ফসলের লক্ষণও পর্যবেক্ষণ করুন।"],
              ["বাতাসের গতি", "স্প্রে, সার প্রয়োগ, পলিথিন বা নেট ব্যবস্থাপনা এবং উঁচু ফসলের সুরক্ষার আগে বাতাসের অবস্থা বিবেচনা করুন। পণ্যের লেবেলের নির্দেশনা মানুন।"],
              ["বজ্রঝড় ও ভারী বৃষ্টি", "বজ্রপাতের সতর্কতায় খোলা মাঠ, উঁচু গাছ ও ধাতব যন্ত্রপাতি থেকে দূরে নিরাপদ আশ্রয়ে যান। ভারী বৃষ্টির আগে নালা ও পানি বের হওয়ার পথ পরীক্ষা করুন।"],
              ["শুষ্ক ও গরম আবহাওয়া", "মাটির আর্দ্রতা পর্যবেক্ষণ করুন, প্রয়োজনমতো সেচ পরিকল্পনা করুন এবং চারা বা সংবেদনশীল ফসলের জন্য উপযুক্ত সুরক্ষা ব্যবস্থা বিবেচনা করুন।"],
            ].map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <h3 className="font-extrabold text-emerald-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">
              কৃষিকাজে আবহাওয়ার তথ্য কীভাবে ব্যবহার করবেন?
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                ["১. নিজের এলাকার তথ্য নির্বাচন করুন", "আবহাওয়া প্যানেল থেকে তালিকাভুক্ত এলাকার মধ্যে আপনার এলাকার কাছাকাছি স্থান বেছে নিন। তালিকায় সব জেলা নেই; নির্বাচিত স্থানের পূর্বাভাসকে আশপাশের প্রতিটি গ্রামের হুবহু আবহাওয়া ধরে নেবেন না।"],
                ["২. কাজের আগে ৫ দিনের পূর্বাভাস দেখুন", "বপন, চারা রোপণ, সেচ, সার প্রয়োগ, স্প্রে ও ফসল কাটার পরিকল্পনার আগে বৃষ্টির সম্ভাবনা, তাপমাত্রা এবং বাতাসের পূর্বাভাস মিলিয়ে নিন।"],
                ["৩. জমির বাস্তব অবস্থা যাচাই করুন", "মাটির আর্দ্রতা হাতে বা উপযুক্ত যন্ত্রে পরীক্ষা করুন। নিচু জমিতে পানি জমেছে কি না, নালা খোলা আছে কি না এবং ফসল কোন বৃদ্ধি পর্যায়ে আছে তা দেখুন।"],
                ["৪. সরকারি সতর্কতা মিলিয়ে নিন", "ঝড়, ঘূর্ণিঝড়, বজ্রপাত, বন্যা বা তাপপ্রবাহের ঝুঁকিতে BMD, BAMIS এবং স্থানীয় প্রশাসনের সর্বশেষ সতর্কতা অনুসরণ করুন।"],
                ["৫. পূর্বাভাস বদলালে পরিকল্পনা সংশোধন করুন", "আবহাওয়ার পূর্বাভাস নতুন তথ্যের সঙ্গে বদলাতে পারে। গুরুত্বপূর্ণ কাজের ঠিক আগে আবার তথ্য দেখুন এবং প্রয়োজন হলে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।"],
              ].map(([title, description]) => (
                <li key={title} className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12 rounded-3xl bg-[#124c35] p-6 text-white sm:p-8">
            <h2 className="text-xl font-black sm:text-2xl">বৃষ্টি, সেচ ও পানি নিষ্কাশন</h2>
            <p className="mt-3 leading-7 text-emerald-50/85">
              বৃষ্টির সম্ভাবনা থাকলেই সেচ পুরোপুরি বন্ধ করা ঠিক নয়। বৃষ্টির পরিমাণ,
              জমির ধরন, মাটির পানি ধারণক্ষমতা, ফসলের বয়স এবং শিকড়ের অঞ্চলের আর্দ্রতা
              বিবেচনা করুন। অতিবৃষ্টি বা জলাবদ্ধতার ঝুঁকিতে জমির নালা, ড্রেন ও পানি
              বের হওয়ার পথ সচল রাখুন।
            </p>
            <p className="mt-3 leading-7 text-emerald-50/85">
              ধান, সবজি, ডাল, তেলবীজ ও ফলের বাগানের পানি ব্যবস্থাপনা এক নয়। ফসলভিত্তিক
              সেচের সিদ্ধান্তে স্থানীয় কৃষি অফিসের পরামর্শ এবং মাটির অবস্থা অগ্রাধিকার দিন।
            </p>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">
              আবহাওয়া ও ফসলের রোগবালাইয়ের সম্পর্ক
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              তাপমাত্রা, পাতায় দীর্ঘসময় ভেজাভাব, আর্দ্রতা ও বৃষ্টির ধরন কিছু রোগের
              সংক্রমণ ও বিস্তারে ভূমিকা রাখতে পারে। তবে আবহাওয়ার তথ্য দিয়ে একা রোগ
              শনাক্ত করা যায় না। জমি নিয়মিত পর্যবেক্ষণ করুন, আক্রান্ত গাছের লক্ষণ
              নথিবদ্ধ করুন এবং নিশ্চিত না হয়ে বালাইনাশক ব্যবহার করবেন না।
            </p>
            <p className="mt-3 leading-8 text-slate-600">
              রোগের লক্ষণ দেখলে AGRIVA-র <Link className="font-bold text-emerald-800 underline" href="/crop-disease">ফসলের রোগ সহায়তা</Link> পেজে
              ছবি দিয়ে প্রাথমিক বিশ্লেষণ নিতে পারেন। ফলাফলকে চূড়ান্ত রোগ নির্ণয় ধরে
              নেবেন না; প্রয়োজন হলে কৃষি কর্মকর্তার সহায়তা নিন।
            </p>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">সম্পর্কিত কৃষি টুলস ও গাইড</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href="/tools/crop-calendar" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">
                ফসল ক্যালেন্ডার <span className="mt-1 block text-sm font-normal text-slate-500">মৌসুম ও ফসলের কাজের সময় পরিকল্পনা করুন।</span>
              </Link>
              <Link href="/crop-disease" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">
                ফসলের রোগ সহায়তা <span className="mt-1 block text-sm font-normal text-slate-500">ছবি ও লক্ষণ দিয়ে প্রাথমিক রোগ বিশ্লেষণ নিন।</span>
              </Link>
              <Link href="/farms" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">
                আমার খামার <span className="mt-1 block text-sm font-normal text-slate-500">জমি, ফসল ও মাঠের কাজের রেকর্ড রাখুন।</span>
              </Link>
              <Link href="/learn" className="rounded-xl border border-slate-200 p-4 font-bold text-emerald-800 hover:border-emerald-400">
                কৃষি শেখার কেন্দ্র <span className="mt-1 block text-sm font-normal text-slate-500">ফসল ও সমন্বিত বালাই ব্যবস্থাপনা সম্পর্কে জানুন।</span>
              </Link>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">সাধারণ প্রশ্ন ও উত্তর</h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-5">
                  <summary className="cursor-pointer list-none pr-6 font-bold text-slate-900 marker:hidden">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="mt-12 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <h2 className="font-extrabold text-sky-950">বিশ্বস্ত আবহাওয়া ও কৃষি-আবহাওয়া তথ্যসূত্র</h2>
            <p className="mt-2 text-sm leading-7 text-sky-950/80">
              AGRIVA-র পূর্বাভাস পরিকল্পনায় সহায়ক। জরুরি বা কৃষি-নির্দিষ্ট সিদ্ধান্তে সরকারি উৎসের সর্বশেষ বুলেটিন যাচাই করুন।
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li><a className="font-semibold text-emerald-800 underline" href="https://www.bmd.gov.bd/" target="_blank" rel="noreferrer">বাংলাদেশ আবহাওয়া অধিদপ্তর (BMD)</a> — সরকারি আবহাওয়া পূর্বাভাস ও সতর্কতা।</li>
              <li><a className="font-semibold text-emerald-800 underline" href="https://www.bamis.gov.bd/" target="_blank" rel="noreferrer">বাংলাদেশ কৃষি আবহাওয়া তথ্য সেবা (BAMIS)</a> — জেলা কৃষি আবহাওয়া বুলেটিন, ফসল-আবহাওয়া তথ্য ও কৃষি পরামর্শ।</li>
              <li><a className="font-semibold text-emerald-800 underline" href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Open-Meteo API documentation</a> — AGRIVA আবহাওয়া প্যানেলের ডেটা সরবরাহকারী ও API তথ্য।</li>
            </ul>
          </aside>

          <p className="mt-8 text-xs leading-6 text-slate-500">
            সতর্কতা: আবহাওয়ার পূর্বাভাস সম্ভাবনাভিত্তিক এবং স্থানভেদে পার্থক্য হতে পারে।
            এটি সরকারি দুর্যোগ সতর্কতা, মাঠপর্যায়ের পর্যবেক্ষণ বা কৃষি কর্মকর্তার পরামর্শের বিকল্প নয়।
          </p>
        </div>
      </section>
    </main>
  );
}
