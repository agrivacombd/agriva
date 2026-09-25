import type { Metadata } from "next";
import CropDiseaseAssistant from "@/components/tools/CropDiseaseAssistant";

export const metadata: Metadata = {
  title: "AI Crop Disease & Pest Assistant Bangladesh | ফসলের রোগ | AGRIVA",
  description: "Describe crop symptoms and get an AI-assisted list of possible disease or pest causes, questions to check, and safe next steps for farmers.",
  alternates: { canonical: "/tools/crop-disease-assistant" },
  keywords: ["AI crop disease assistant Bangladesh", "crop disease identification", "crop pest identification", "ফসলের রোগ", "ফসলের পোকা", "কৃষি AI"],
};

export default function CropDiseaseAssistantPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA AI Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">AI Crop Disease & Pest Assistant</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Describe what you see on your crop and AGRIVA can organize possible causes, useful follow-up questions and practical next steps. Image analysis can be connected later.</p><CropDiseaseAssistant /><article className="prose prose-green mt-14 max-w-none"><h2>How the AI crop disease assistant works</h2><p>The assistant uses crop, symptom and field-context information to structure a preliminary assessment. It should not be treated as a confirmed diagnosis.</p><h2>What information helps</h2><p>Include crop variety, plant age, affected plant part, visible symptoms, recent weather, irrigation and whether nearby plants show similar symptoms. A clear close-up and whole-plant photo can improve a future image-analysis workflow.</p><h2>Important farmer safety note</h2><p>Do not apply pesticides solely from an AI suggestion. Confirm the problem using trusted agricultural guidance, product labels and qualified local expertise before using any regulated farm input.</p><h2>Frequently asked questions</h2><h3>Can AGRIVA identify a disease from a photo?</h3><p>The page is prepared for a future image-analysis integration. A photo-based result should still be presented as a possible identification, not certainty.</p><h3>Can the assistant connect to AGRIVA products?</h3><p>Yes. After a verified problem category is available, AGRIVA can show relevant educational articles and approved marketplace products without making an unsupported treatment claim.</p></article></section></main>;
}
