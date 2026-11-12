/**
 * Curated, verified AGRIVA route catalogue. Suggestions are editorial recommendations,
 * not inserted links or claims that a product is in stock.
 */
export type SeoInternalLink = { href: string; label: string; reason: string };
const catalogue: Array<SeoInternalLink & { terms: string[] }> = [
  { href: "/marketplace/category/seeds", label: "বীজের ক্যাটাগরি", reason: "বীজ নির্বাচন ও কেনাকাটার প্রাসঙ্গিক তথ্য", terms: ["বীজ","seed","চারা","রোপণ","টমেটো","ধান","সবজি"] },
  { href: "/marketplace", label: "AGRIVA Marketplace", reason: "প্রাসঙ্গিক কৃষিপণ্য খুঁজে দেখুন", terms: ["কৃষিপণ্য","সার","যন্ত্র","কেনা","বাজার","marketplace"] },
  { href: "/plant-market", label: "AGRIVA Plant Market", reason: "উদ্ভিদ ও চারার বাজার দেখুন", terms: ["গাছ","চারা","নার্সারি","plant","ফুল"] },
  { href: "/tools/seed-rate-calculator", label: "বীজের হার ক্যালকুলেটর", reason: "জমি অনুযায়ী বীজের পরিমাণ হিসাব", terms: ["বীজ","বপন","seed rate","ধান"] },
  { href: "/tools/fertilizer-calculator", label: "সার ক্যালকুলেটর", reason: "সারের পরিকল্পনায় সহায়ক টুল", terms: ["সার","পুষ্টি","fertilizer","মাটি"] },
  { href: "/tools/irrigation-water-calculator", label: "সেচের পানি ক্যালকুলেটর", reason: "সেচ পরিকল্পনায় সহায়ক টুল", terms: ["সেচ","পানি","irrigation","জল"] },
  { href: "/tools/crop-profit-calculator", label: "ফসলের লাভ ক্যালকুলেটর", reason: "চাষের আয়-ব্যয় বিশ্লেষণ", terms: ["লাভ","খরচ","আয়","profit","ফসল"] },
  { href: "/tools/crop-disease-assistant", label: "ফসলের রোগ সহায়ক টুল", reason: "রোগের লক্ষণ নিয়ে আরও জানতে", terms: ["রোগ","পোকা","বালাই","পাতা","disease"] },
  { href: "/tools/crop-calendar", label: "ফসল ক্যালেন্ডার", reason: "মৌসুম ও চাষের সময় পরিকল্পনা", terms: ["মৌসুম","চাষ","রোপণ","ক্যালেন্ডার","ফসল"] },
  { href: "/learn", label: "AGRIVA কৃষি শেখার কেন্দ্র", reason: "সম্পর্কিত কৃষি শিক্ষামূলক লেখা", terms: ["কৃষি","চাষ","শিখ","পদ্ধতি","guide"] },
];
export function suggestSeoInternalLinks(topic: string, max = 4): SeoInternalLink[] {
  const query = topic.toLocaleLowerCase("bn-BD");
  return catalogue.map(({ terms, ...link }) => ({
    link, score: terms.reduce((n, term) => n + (query.includes(term) ? 1 : 0), 0)
  })).filter(x => x.score > 0).sort((a,b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(max, 6))).map(x => x.link);
}
