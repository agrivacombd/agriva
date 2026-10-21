import type { SearchIntent } from "@/lib/ai/intent";

export type AgricultureAnswer = {
  answer: string;
  source: "gemini" | "openai" | "built-in";
  fallbackReason?: "missing_api_key" | "provider_error" | "empty_response";
};

function builtInAnswer(question: string, intent: SearchIntent = "information") {
  if (/(black rice|কালো ধান|কালো চাল|কালো চাউল)/i.test(question)) {
    return "কালো চাল (black rice) সাধারণত গাঢ় বেগুনি/কালো রঙের ধানের জাত থেকে পাওয়া যায়; এর রঙের জন্য anthocyanin নামের প্রাকৃতিক রঞ্জক দায়ী। আপনি যদি চাষ করতে চান, তাহলে আপনার এলাকার উপযোগী ও নির্ভরযোগ্য বীজের জাত, বীজের বিশুদ্ধতা, মৌসুম, জমির ধরন এবং স্থানীয় কৃষি অফিসের সুপারিশ যাচাই করুন—সব জাত সব এলাকায় সমান ফলন দেয় না। আপনি কোন তথ্যটি চান: (১) চাষের নিয়ম, (২) বীজ কোথায় পাবেন, (৩) পুষ্টিগুণ, নাকি (৪) বাজারদর? নির্দিষ্ট এলাকার বর্তমান দাম/স্টক যাচাই না করে নিশ্চিত করে বলা সম্ভব নয়।";
  }
  if (/(mango|আম|আমের)/i.test(question)) {
    return "আম চাষে ভালো ফলনের জন্য আপনার এলাকার উপযোগী জাত, সুস্থ চারা, সঠিক দূরত্ব, পানি নিষ্কাশন এবং মৌসুম অনুযায়ী পরিচর্যা গুরুত্বপূর্ণ। মুকুল বা ফলের সময় রোগ-পোকা দেখা দিলে আক্রান্ত অংশের ছবি ও এলাকার নাম দিলে পরামর্শ আরও নির্দিষ্ট করা যাবে। আপনি আমের চাষ, রোগ-পোকা, সার ব্যবস্থাপনা, নাকি বাজারদর সম্পর্কে জানতে চান?";
  }
  if (/(ধান|rice|paddy|wheat|গম|tomato|টমেটো|potato|আলু|chili|মরিচ|maize|ভুট্টা)/i.test(question) && /(পাতা|leaf|দাগ|spot|রোগ|disease|পোকা|pest|হলুদ|yellow|পচে|rot)/i.test(question)) {
    return "সমস্যাটি বুঝতে ফসলের নাম, গাছের বয়স, এলাকার নাম এবং আক্রান্ত পাতার ছবি/দাগের রং জানা দরকার। আপাতত জমিতে পানি জমে থাকলে নিষ্কাশন করুন এবং আক্রান্ত গাছ নিয়মিত পর্যবেক্ষণ করুন। নিশ্চিত শনাক্তকরণ ছাড়া কীটনাশক বা ছত্রাকনাশক ব্যবহার করবেন না; স্থানীয় কৃষি কর্মকর্তার সঙ্গে মিলিয়ে নিন।";
  }
  if (/(পাতা|leaf|দাগ|spot|রোগ|disease|পোকা|pest|আক্রান্ত)/i.test(question)) {
    return "সমস্যাটি বুঝতে ফসলের নাম, গাছের বয়স, আক্রান্ত পাতার ছবি এবং দাগের রং/আকার জানা দরকার। আপাতত আক্রান্ত গাছ পর্যবেক্ষণ করুন, জমিতে পানি জমে থাকলে নিষ্কাশন করুন এবং রোগ ছড়ানো কমাতে আক্রান্ত অংশ সাবধানে সরান। নিশ্চিত শনাক্তকরণ ছাড়া কীটনাশক ব্যবহার করবেন না।";
  }
  if (/(সার|fertili[sz]er|মাটি|soil|pH)/i.test(question)) {
    return "সার ব্যবস্থাপনা ফসল, মাটির ধরন, চাষের পর্যায় এবং মাটির পরীক্ষার ফলের ওপর নির্ভর করে। সম্ভব হলে মাটি পরীক্ষা করে সুপারিশ অনুসরণ করুন, সুষম সার ব্যবহার করুন এবং অতিরিক্ত সার প্রয়োগ এড়িয়ে চলুন। আপনার ফসলের নাম, জমির পরিমাণ ও চাষের পর্যায় জানালে আরও নির্দিষ্টভাবে সাহায্য করতে পারি।";
  }
  if (intent === "product" || /(দাম|কিনতে|buy|price|বাজার|বীজ|seed|পণ্য|product)/i.test(question)) {
    return "পণ্য বাছাইয়ের আগে পণ্যের নাম, উপাদান/গ্রেড, মেয়াদ, প্রস্তুতকারক এবং অনুমোদন যাচাই করুন। দাম ও মজুত এলাকা ও বিক্রেতাভেদে বদলায়; বর্তমান দাম যাচাই না করে নির্দিষ্ট মূল্য বলা ঠিক হবে না। কোন পণ্য ও কোন এলাকার তথ্য জানতে চান?";
  }
  return "আমি ফসল, মাটি, সেচ, সার, রোগ-পোকা এবং কৃষি ব্যবস্থাপনা বিষয়ে সাহায্য করতে পারি। ভালো পরামর্শের জন্য ফসলের নাম, এলাকা, গাছের বয়স/চাষের পর্যায় এবং কী সমস্যা হচ্ছে তা জানান। গুরুত্বপূর্ণ সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তা বা কৃষি সম্প্রসারণ অধিদপ্তরের পরামর্শ মিলিয়ে নিন।";
}

export async function answerAgricultureQuestion(question: string, intent: SearchIntent = "information"): Promise<AgricultureAnswer> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(geminiKey),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: [
              "You are AGRIVA AI, a careful agriculture assistant for Bangladesh.",
              "Answer in the language the user uses, preferably Bangla for Bangla questions. Give practical, concise guidance.",
              "Never claim certainty when symptoms are insufficient. Do not invent current prices, product availability, pesticide doses, or official recommendations.",
              "For crop disease, ask for crop/location/photos if needed and recommend checking with a local agricultural officer before chemical treatment.",
              "Question: " + question
            ].join("\\n") }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 700 }
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        const answer = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
        if (typeof answer === "string" && answer) return { answer, source: "gemini" };
        console.error("AGRIVA Gemini returned an empty response");
      } else {
        console.error("AGRIVA Gemini provider returned status:", response.status);
      }
    } catch (error) {
      console.error("AGRIVA Gemini request failed:", error);
    }
    // If Gemini is temporarily unavailable, use OpenAI when configured.
    if (!openAiKey) return { answer: builtInAnswer(question, intent), source: "built-in", fallbackReason: "provider_error" };
  }

  if (openAiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + openAiKey, "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
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
      if (!response.ok) {
        console.error("AGRIVA OpenAI provider returned status:", response.status);
        return { answer: builtInAnswer(question, intent), source: "built-in", fallbackReason: "provider_error" };
      }
      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) return { answer: builtInAnswer(question, intent), source: "built-in", fallbackReason: "empty_response" };
      return { answer: answer.trim(), source: "openai" };
    } catch (error) {
      console.error("AGRIVA OpenAI provider request failed:", error);
      return { answer: builtInAnswer(question, intent), source: "built-in", fallbackReason: "provider_error" };
    }
  }

  return { answer: builtInAnswer(question, intent), source: "built-in", fallbackReason: "missing_api_key" };
}
