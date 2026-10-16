export type SearchIntent = "product" | "crop_health" | "information";

export function detectIntent(query: string): SearchIntent {
  const text = query.toLowerCase();
  if (/\b(buy|price|product|shop|seed|seeds|fertilizer|pesticide|medicine)\b|সার|ওষুধ|কিনতে|দাম|বীজ|পণ্য|কোথায় পাব|কোথায় পাব|বিক্রেতা/i.test(text)) return "product";
  if (/\b(disease|pest|leaf|spot|diagnos|infected)\b|রোগ|পোকা|পাতা|দাগ|আক্রান্ত|হলুদ হয়ে|হলুদ হয়ে|পচে/i.test(text)) return "crop_health";
  return "information";
}

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}
