import Link from "next/link";

type Locale = "bn" | "en";

const tools = [
  {
    href: "fertilizer-calculator",
    icon: "🧪",
    bnTitle: "সার হিসাব ক্যালকুলেটর",
    enTitle: "Fertilizer Rate Calculator",
    bnDescription: "জমির আয়তন ও নির্ধারিত সারের হার থেকে মোট প্রয়োজনীয় সার হিসাব করুন।",
    enDescription: "Estimate fertilizer quantities using your field area and recommended application rate.",
    bnKeywords: "সার হিসাব, জমি অনুযায়ী সারের পরিমাণ",
    enKeywords: "fertilizer calculator, fertilizer rate per acre",
  },
  {
    href: "seed-rate-calculator",
    icon: "🌱",
    bnTitle: "বীজের হার ক্যালকুলেটর",
    enTitle: "Seed Rate Calculator",
    bnDescription: "একর, হেক্টর বা শতক অনুযায়ী বীজের প্রয়োজনীয় পরিমাণ বের করুন।",
    enDescription: "Calculate seed requirements for acres, hectares or decimals.",
    bnKeywords: "বীজের হিসাব, বীজের হার ক্যালকুলেটর",
    enKeywords: "seed rate calculator, seed quantity by area",
  },
  {
    href: "farming-cost-profit-calculator",
    icon: "৳",
    bnTitle: "চাষের খরচ ও লাভ-লোকসান",
    enTitle: "Farming Cost and Profit Calculator",
    bnDescription: "বীজ, সার, শ্রম, সেচ, উৎপাদন ও বিক্রয়মূল্য ধরে সম্ভাব্য লাভ বা লোকসান হিসাব করুন।",
    enDescription: "Estimate farm production costs, revenue and profit or loss using your own inputs.",
    bnKeywords: "চাষের খরচ, কৃষি লাভ লোকসান",
    enKeywords: "farming cost calculator, crop profit calculator",
  },
  {
    href: "crop-calendar",
    icon: "🗓️",
    bnTitle: "ফসল ক্যালেন্ডার ও কাজের চেকলিস্ট",
    enTitle: "Crop Calendar and Task Checklist",
    bnDescription: "মৌসুমের কৃষিকাজের ধাপ চিহ্নিত করে অগ্রগতি অনুসরণ করুন।",
    enDescription: "Track seasonal farming tasks and save checklist progress in your browser.",
    bnKeywords: "ফসল ক্যালেন্ডার, চাষের কাজের তালিকা",
    enKeywords: "crop calendar, farming task checklist",
  },
];

export default function CalculatorDirectory({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const base = en ? "/en" : "";
  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white sm:p-10 lg:p-14">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">{en ? "FREE AGRICULTURE TOOLS" : "ফ্রি কৃষি হিসাব ও পরিকল্পনা টুল"}</span>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{en ? "Agriculture Calculators for Fertilizer, Seed, Farm Costs and Crop Planning" : "কৃষি ক্যালকুলেটর: সার, বীজ, চাষের খরচ ও ফসল পরিকল্পনা"}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">{en ? "Practical farming calculators for growers, students and agricultural professionals. Choose a tool, enter your own field data and compare scenarios before making decisions." : "কৃষক, কৃষি শিক্ষার্থী ও কৃষি পেশাজীবীদের জন্য এক জায়গায় দরকারি হিসাব। নিজের জমি, খরচ ও উৎপাদনের তথ্য দিয়ে হিসাব করুন এবং সিদ্ধান্তের আগে বিভিন্ন পরিস্থিতি তুলনা করুন।"}</p>
        </section>

        <section aria-labelledby="calculator-list" className="mt-8">
          <h2 id="calculator-list" className="text-2xl font-black sm:text-3xl">{en ? "Choose a calculator" : "প্রয়োজন অনুযায়ী ক্যালকুলেটর বেছে নিন"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{en ? "Each tool has its own page, focused instructions and search-friendly title. Results are estimates based on the values you enter." : "প্রতিটি টুলের আলাদা পেজ, স্পষ্ট নির্দেশনা ও নির্দিষ্ট বিষয়ভিত্তিক শিরোনাম রয়েছে। ফলাফল আপনার দেওয়া তথ্যের ভিত্তিতে আনুমানিক হিসাব।"}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {tools.map((tool) => <Link key={tool.href} href={base + "/" + tool.href} className="group flex h-full flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">{tool.icon}</span>
              <h3 className="mt-4 text-xl font-black">{en ? tool.enTitle : tool.bnTitle}</h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-slate-600">{en ? tool.enDescription : tool.bnDescription}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800">{en ? "Open calculator →" : "ক্যালকুলেটর খুলুন →"}</span>
            </Link>)}
          </div>
        </section>

        <section className="mt-8 grid gap-5 rounded-3xl border border-emerald-100 bg-white p-5 sm:grid-cols-2 sm:p-8">
          <div><h2 className="text-lg font-black">{en ? "Use local recommendations" : "স্থানীয় কৃষি নির্দেশনা অনুসরণ করুন"}</h2><p className="mt-2 text-sm leading-7 text-slate-600">{en ? "Fertilizer and seed rates vary by crop, variety, soil, climate and planting method. Use soil-test results and local agronomist guidance rather than treating sample rates as universal recommendations." : "ফসল, জাত, মাটি, আবহাওয়া ও বপন পদ্ধতি অনুযায়ী সার ও বীজের হার বদলায়। উদাহরণ হিসেবে দেওয়া হারকে সর্বজনীন সুপারিশ না ধরে মাটি পরীক্ষা ও স্থানীয় কৃষি কর্মকর্তার নির্দেশনা অনুসরণ করুন।"}</p></div>
          <div><h2 className="text-lg font-black">{en ? "Plan costs realistically" : "বাস্তবসম্মত খরচের হিসাব রাখুন"}</h2><p className="mt-2 text-sm leading-7 text-slate-600">{en ? "Include labour, irrigation, land rent, transport, storage, finance costs and possible crop losses when estimating profitability. Actual market prices and yields may differ." : "লাভের হিসাব করার সময় শ্রম, সেচ, জমির ভাড়া, পরিবহন, সংরক্ষণ, ঋণের খরচ ও সম্ভাব্য ফসলহানি অন্তর্ভুক্ত করুন। বাস্তব বাজারদর ও ফলন হিসাবের থেকে আলাদা হতে পারে।"}</p></div>
        </section>

        <section className="mt-8 rounded-3xl bg-emerald-950 p-6 text-white sm:p-8">
          <h2 className="text-2xl font-black">{en ? "Built for more than one region" : "বাংলাদেশের বাইরে ব্যবহারের জন্যও প্রস্তুত"}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50">{en ? "Choose acres, hectares or decimals for area calculations. For cost and revenue estimates, select the currency you use. Currency selection changes display format only; it does not convert exchange rates." : "জমির হিসাব একর, হেক্টর বা শতকে করুন। খরচ ও আয়ের হিসাবের জন্য নিজের মুদ্রা বেছে নিন। মুদ্রা নির্বাচন শুধু প্রদর্শনের ফরম্যাট বদলায়—এটি বৈদেশিক মুদ্রার বিনিময় হার দিয়ে টাকা রূপান্তর করে না।"}</p>
        </section>
      </div>
    </main>
  );
}
