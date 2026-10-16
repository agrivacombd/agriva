export type SearchIntent = "product" | "crop_health" | "information";

export function detectIntent(query: string): SearchIntent {
  const text = query.toLowerCase();
  if (/(\bbuy\b|\bprice\b|\bproduct\b|\bshop\b|\bseed\b|\bseeds\b|\bfertilizer\b|\bpesticide\b|\bmedicine\b|সার|ওষুধ|কিনতে|দাম|বীজ|পণ্য|কোথায় পাব|কোথায় পাব|বিক্রেতা)/i.test(text)) return "product";
  if (/(\bdisease\b|\bpest\b|\bleaf\b|\bspot\b|\bdiagnos\b|\binfected\b|রোগ|পোকা|পাতা|দাগ|আক্রান্ত|হলুদ হয়ে|হলুদ হয়ে|পচে)/i.test(text)) return "crop_health";
  return "information";
}

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}
