import { detectIntent, type SearchIntent } from "@/lib/ai/intent";

export type SearchAnalysis = {
  intent: SearchIntent;
  topic: string;
  crop: string | null;
  suggestedTitle: string;
  opportunityType: "article" | "product";
};

export async function analyzeSearch(query: string): Promise<SearchAnalysis> {
  const intent = detectIntent(query);
  const text = query.trim();
  // Bengali Unicode letters do not form JavaScript \b word boundaries.
  // Keep explicit boundaries for English names and match Bengali names directly.
  const cropMatch = text.match(/black rice|mango|\brice\b|\bpaddy\b|ধান|কালো চাল|কালো ধান|আম|\bwheat\b|গম|\btomato\b|টমেটো|\bpotato\b|আলু|\bchili\b|মরিচ|\bmaize\b|ভুট্টা/i);
  const crop = cropMatch?.[0] ?? null;
  const topic = text;
  const opportunityType = intent === "product" ? "product" : "article";
  const suggestedTitle = opportunityType === "product"
    ? `AGRIVA product opportunity: ${text}`
    : `AGRIVA guide: ${text}`;

  return { intent, topic, crop, suggestedTitle, opportunityType };
}
