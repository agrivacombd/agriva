import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

export async function POST(request: NextRequest) {
  const access = await requireAdminApi("catalog.edit");
  if (!access.ok) return access.response;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OpenAI API is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  const { data: product, error } = await access.supabase.from("products").select("id,name,slug,description,category,category_slug,subcategory_slug,brand,origin,highlights,usage_instructions,seo_title,seo_description,focus_keyword,seo_keywords,image_alt").eq("id", productId).is("deleted_at", null).single();
  if (error || !product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: controller.signal, cache: "no-store",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an expert Bengali e-commerce product SEO editor for AGRIVA Bangladesh. Output ONLY JSON with fields seo_title, seo_description, focus_keyword, seo_keywords (array of strings), highlights (array of strings), image_alt, improved_description (HTML limited to p,h2,h3,ul,li,strong). Use only facts explicitly provided. Do not invent brand, origin, package size, seed germination, purity, certification, health claims, agronomic guarantees or image appearance. If image contents cannot be verified, image_alt must be an empty string. Prefer natural Bengali search intent, avoid keyword stuffing. SEO title target 30-60 characters; meta description target 120-160 characters. Do not add unsupported claims. Provide concise, useful product copy. No script, links, or unsafe HTML." },
          { role: "user", content: JSON.stringify(product).slice(0, 14000) },
        ],
      }),
    });
    if (!response.ok) return NextResponse.json({ error: "AI service is temporarily unavailable." }, { status: 502 });
    const json = await response.json();
    const raw = json?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("Empty response");
    const suggestion = JSON.parse(raw);
    const string = (key: string, max: number) => typeof suggestion[key] === "string" ? suggestion[key].trim().slice(0, max) : "";
    const list = (key: string, max: number) => Array.isArray(suggestion[key]) ? suggestion[key].filter((x: unknown): x is string => typeof x === "string").map((x: string) => x.trim().slice(0, 120)).filter(Boolean).slice(0, max) : [];
    return NextResponse.json({ suggestion: {
      seo_title: string("seo_title", 70),
      seo_description: string("seo_description", 200),
      focus_keyword: string("focus_keyword", 100),
      seo_keywords: list("seo_keywords", 8),
      highlights: list("highlights", 5),
      image_alt: string("image_alt", 180),
      improved_description: string("improved_description", 15000),
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to generate suggestions. Please try again." }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
