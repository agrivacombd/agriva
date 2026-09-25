export type SearchIntent = "product" | "crop_health" | "information";

export function detectIntent(query: string): SearchIntent {
  const text = query.toLowerCase();
  if (/buy|price|product|fertilizer|medicine|সার|ওষুধ|কিনতে|দাম/.test(text)) return "product";
  if (/disease|pest|leaf|spot|রোগ|পোকা|পাতা|দাগ/.test(text)) return "crop_health";
  return "information";
}

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}
