import type { SearchIntent } from "@/lib/ai/intent";

export type AgricultureAnswer = {
  answer: string;
  source: "openai" | "built-in";
};

function builtInAnswer(question: string, intent: SearchIntent = "information") {
  const q = question.toLowerCase();
  if (/(পাতা|leaf|দাগ|spot|রোগ|disease|পোকা|pest)/i.test(q)) {
    return "সমস্যাটি বুঝতে ফসলের নাম, গাছের বয়স, আক্রান্ত পাতার ছবি এবং দাগের রং/আকার জানা দরকার। আপাতত আক্রান্ত গাছ নিয়মিত পর্যবেক্ষণ করুন, জমিতে পানি জমে থাকলে নিষ্কাশন করুন, এবং রোগাক্রান্ত গাছ/পাতা অন্য গাছে না ছড়ানোর ব্যবস্থা নিন। নিশ্চিত শনাক্তকরণ ছাড়া কীটনাশক বা ছত্রাকনাশক ব্যবহার করবেন না।";
  }
  if (/(সার|fertili[sz]er|মাটি|soil|pH)/i.test(q)) {
    return "সার ব্যবস্থাপনা ফসল, জমির মাটির ধরন, চাষের পর্যায় এবং মাটির পরীক্ষার ফলের ওপর নির্ভর করে। সম্ভব হলে মাটি পরীক্ষা করে সুপারিশ অনুসরণ করুন, সুষম সার ব্যবহার করুন এবং একবারে অতিরিক্ত সার প্রয়োগ এড়িয়ে চলুন। আপনার ফসলের নাম ও জমির পরিমাণ জানালে আরও নির্দিষ্টভাবে সাহায্য করতে পারি।";
  }
  if (intent === "product" || /(দাম|কিনতে|buy|price|বাজার)/i.test(q)) {
    return "পণ্য বাছাইয়ের আগে পণ্যের নাম, উপাদান/গ্রেড, মেয়াদ, প্রস্তুতকারক এবং অনুমোদন যাচাই করুন। দাম এলাকা ও বিক্রেতাভেদে বদলাতে পারে—কেনার আগে স্থানীয় একাধিক বিক্রেতার সঙ্গে তুলনা করুন। কোন পণ্য ও কোন এলাকার দাম জানতে চান?";
  }
  return "আমি ফসল, মাটি, সেচ, সার, রোগ-পোকা এবং কৃষি ব্যবস্থাপনা বিষয়ে সাহায্য করতে পারি। ভালো পরামর্শের জন্য ফসলের নাম, এলাকা, গাছের বয়স/চাষের পর্যায় এবং কী সমস্যা হচ্ছে তা জানান। গুরুত্বপূর্ণ সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তা বা কৃষি সম্প্রসারণ অধিদপ্তরের পরামর্শ মিলিয়ে নিন।";
}

export async function answerAgricultureQuestion(question: string, intent: SearchIntent = "information"): Promise<AgricultureAnswer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { answer: builtInAnswer(question, intent), source: "built-in" };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: "system", content: "You are AGRIVA AI, a careful agriculture assistant for Bangladesh. Answer in the language the user uses, preferably Bangla for Bangla questions. Give practical, concise guidance. Never claim certainty when symptoms are insufficient. Do not invent current prices, product availability, pesticide doses, or official recommendations. For crop disease, ask for crop/location/photos if needed and recommend checking with a local agricultural officer before chemical treatment." },
          { role: "user", content: question }
        ]
      })
    });
    if (!response.ok) return { answer: builtInAnswer(question, intent), source: "built-in" };
    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return { answer: builtInAnswer(question, intent), source: "built-in" };
    return { answer: answer.trim(), source: "openai" };
  } catch {
    return { answer: builtInAnswer(question, intent), source: "built-in" };
  }
}
