import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET() {
  const access = await requireAdminApi("content.read");
  if (!access.ok) return access.response;
  const { data, error } = await access.supabase.from("seo_landing_pages")
    .select("*").order("updated_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Could not load landing pages." }, { status: 500 });
  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const slug = cleanText(body.slug, 180);
  const title = cleanText(body.title, 160);
  if (!slugPattern.test(slug) || !title) return NextResponse.json({ error: "A title and valid URL slug are required." }, { status: 400 });
  const faq = Array.isArray(body.faq) ? body.faq.slice(0, 20).filter((item: unknown) => item && typeof item === "object").map((item: any) => ({ question: cleanText(item.question, 240), answer: cleanText(item.answer, 2000) })).filter((item: any) => item.question && item.answer) : [];
  const values = {
    slug, title, meta_title: cleanText(body.meta_title, 160) || null,
    meta_description: cleanText(body.meta_description, 320) || null,
    canonical_url: cleanText(body.canonical_url, 500) || null,
    noindex: body.noindex === true,
    hero_title: cleanText(body.hero_title, 180) || null,
    hero_description: cleanText(body.hero_description, 1000) || null,
    body_markdown: typeof body.body_markdown === "string" ? body.body_markdown.slice(0, 50000) : "",
    faq, cta_label: cleanText(body.cta_label, 80) || null,
    cta_url: cleanText(body.cta_url, 500) || null,
  };
  const id = typeof body.id === "string" ? body.id : null;
  const query = id
    ? access.supabase.from("seo_landing_pages").update(values).eq("id", id).eq("status", "draft").select("id,slug,status").maybeSingle()
    : access.supabase.from("seo_landing_pages").insert({ ...values, created_by: access.user.id }).select("id,slug,status").single();
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This URL slug is already in use." : "Could not save landing page." }, { status: error.code === "23505" ? 409 : 500 });
  if (!data) return NextResponse.json({ error: "Only draft pages can be edited. Return the page to draft first." }, { status: 409 });
  return NextResponse.json({ page: data });
}
