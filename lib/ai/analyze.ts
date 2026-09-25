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
  const cropMatch = text.match(/\b(rice|ধান|wheat|গম|tomato|টমেটো|potato|আলু|chili|মরিচ|maize|ভুট্টা)\b/i);
  const crop = cropMatch?.[0] ?? null;
  const topic = text;
  const opportunityType = intent === "product" ? "product" : "article";
  const suggestedTitle = opportunityType === "product"
    ? `AGRIVA product opportunity: ${text}`
    : `AGRIVA guide: ${text}`;

  return { intent, topic, crop, suggestedTitle, opportunityType };
}
