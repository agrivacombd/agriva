import type { Metadata } from "next";
import AISearchIntelligence from "@/components/tools/AISearchIntelligence";

export const metadata: Metadata = {
  title: "AI Search Intelligence for Agriculture | AGRIVA",
  description: "Turn farmer search queries into intent signals, keyword opportunities and AI-assisted article briefs for admin review.",
  alternates: { canonical: "/tools/ai-search-intelligence" },
  keywords: ["agriculture search intelligence", "farmer search analytics", "AI SEO content agriculture", "keyword intent agriculture", "AGRIVA AI search"],
};

export default function AISearchIntelligencePage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Admin Intelligence</p><h1 className="mt-3 text-4xl font-black md:text-5xl">AI Search Intelligence</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Review high-interest farmer search queries, classify search intent and generate an SEO article brief for admin review before publishing.</p><AISearchIntelligence /><article className="prose prose-green mt-14 max-w-none"><h2>From search query to article draft</h2><p>AGRIVA can collect anonymized search terms, group similar queries and identify informational, product, comparison or problem-solving intent. An AI workflow can then prepare a content brief with a suggested title, primary keyword, supporting topics, FAQ ideas and internal-link opportunities.</p><h2>Human review before publishing</h2><p>Generated content should remain a draft until an AGRIVA admin checks factual accuracy, agricultural claims, source quality, keyword relevance and usefulness for the intended farmer audience.</p><h2>Privacy-aware analytics</h2><p>Search intelligence should avoid storing unnecessary personal information. Production analytics can store the query, timestamp, language, intent and aggregate counts while applying retention and access controls.</p><h2>SEO workflow</h2><p>The planned workflow is: search query → intent classification → keyword clustering → competitor/content research → AI article brief → draft → admin review → publish → performance monitoring.</p></article></section></main>;
}
