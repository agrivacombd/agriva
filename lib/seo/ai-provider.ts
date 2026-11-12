import "server-only";

export type SeoAiProvider = "gemini" | "openai";
export type SeoAiResult = { provider: SeoAiProvider; model: string; text: string };

const MAX_PROMPT_LENGTH = 12000;
const MAX_OUTPUT_TOKENS = 1200;

/** Server-only, bounded provider adapter. Never put API keys in client code. */
export async function generateSeoText(prompt: string): Promise<SeoAiResult> {
  if (!prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error("Invalid SEO AI prompt length");
  }
  const provider: SeoAiProvider = process.env.SEO_AI_PROVIDER === "openai" ? "openai" : "gemini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    if (provider === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("Gemini provider is not configured");
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        { method: "POST", signal: controller.signal, cache: "no-store",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 } }) }
      );
      if (!response.ok) throw new Error(`Gemini provider returned HTTP ${response.status}`);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
      if (!text.trim()) throw new Error("Gemini returned no text");
      return { provider, model, text };
    }
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OpenAI provider is not configured");
    const model = process.env.SEO_OPENAI_MODEL || "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal, cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, input: prompt, max_output_tokens: MAX_OUTPUT_TOKENS })
    });
    if (!response.ok) throw new Error(`OpenAI provider returned HTTP ${response.status}`);
    const data = await response.json();
    const text = (data?.output || []).flatMap(
      (item: { content?: Array<{ type?: string; text?: string }> }) => item.content || []
    ).filter((part: { type?: string }) => part.type === "output_text")
      .map((part: { text?: string }) => part.text || "").join("");
    if (!text.trim()) throw new Error("OpenAI returned no text");
    return { provider, model, text };
  } finally {
    clearTimeout(timeout);
  }
}
