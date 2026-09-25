import type { Metadata } from "next";
import AIFarmAssistant from "@/components/tools/AIFarmAssistant";

export const metadata: Metadata = {
  title: "AI Farm Assistant Bangladesh | কৃষি AI সহকারী | AGRIVA",
  description: "Ask AGRIVA's AI Farm Assistant agriculture questions and organize crop, weather, market and farm-record context into practical next steps.",
  alternates: { canonical: "/tools/ai-farm-assistant" },
  keywords: ["AI farm assistant Bangladesh", "agriculture AI assistant", "কৃষি AI", "কৃষকের AI সহকারী", "farmer AI assistant"],
};

export default function AIFarmAssistantPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Intelligence</p><h1 className="mt-3 text-4xl font-black md:text-5xl">AI Farm Assistant</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Ask farming questions in natural language. This interface is prepared to combine farmer context, crop calendar, weather, farm diary and market information into one AI experience.</p><AIFarmAssistant /><article className="prose prose-green mt-14 max-w-none"><h2>What the AGRIVA AI Farm Assistant does</h2><p>The assistant is designed as a central intelligence layer for AGRIVA. A future server-side AI integration can retrieve permitted farm context and relevant AGRIVA tools or articles before generating an answer.</p><h2>Context-aware farming support</h2><p>With user permission, context can include crop, planting date, field records, weather forecast and market observations. The assistant should clearly separate verified data, estimates and AI-generated suggestions.</p><h2>Safety and accuracy</h2><p>AI responses are decision-support information. Disease diagnosis, pesticide use, fertilizer application and other high-impact farm decisions should be checked against trusted local agricultural guidance and product labels.</p><h2>Frequently asked questions</h2><h3>Will the AI automatically access my farm data?</h3><p>No. Production integration should use authenticated access and explicit permission for the data required by each request.</p><h3>Can it answer in Bangla?</h3><p>Yes. The interface accepts Bangla and English questions and can later route them to the selected AI model.</p></article></section></main>;
}
