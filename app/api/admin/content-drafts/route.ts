import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DRAFT_COLUMNS =
  "id,opportunity_id,content_type,title,slug,meta_title,meta_description,primary_keyword,secondary_keywords,search_intent,outline,faq,body_markdown,status,created_at,updated_at";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { response: NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 }) };
  }
  if (profile?.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin role required" }, { status: 403 }) };
  }
  return { supabase, user };
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asStringArray(value: unknown, maxItems = 30): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, maxItems);
}

function safeSlug(title: string) {
  const slug = title.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
  return slug || `agriva-article-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.supabase
    .from("content_drafts")
    .select(DRAFT_COLUMNS)
    .eq("created_by", auth.user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Unable to load saved drafts" }, { status: 500 });
  }
  return NextResponse.json({ drafts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A valid draft payload is required" }, { status: 400 });
  }

  const id = text(body.id, 80);
  const keyword = text(body.primaryKeyword, 160);
  const title = text(body.title, 160);
  const articleBody = text(body.bodyMarkdown, 100000);
  const metaTitle = text(body.metaTitle, 160);
  const metaDescription = text(body.metaDescription, 320);
  const intent = text(body.searchIntent, 40) || "informational";
  const outline = Array.isArray(body.outline) ? body.outline.filter((x: unknown) => typeof x === "string").slice(0, 30) : [];
  const faq = asStringArray(body.faq);
  const secondaryKeywords = asStringArray(body.secondaryKeywords, 20);

  if (!keyword || !title) {
    return NextResponse.json({ error: "Primary keyword and title are required" }, { status: 400 });
  }

  const slug = text(body.slug, 180) || safeSlug(title);
  const values = {
    title,
    slug,
    meta_title: metaTitle || title,
    meta_description: metaDescription || null,
    primary_keyword: keyword,
    secondary_keywords: secondaryKeywords,
    search_intent: intent,
    outline,
    faq,
    body_markdown: articleBody || null,
  };

  if (id) {
    const { data: existing, error: readError } = await auth.supabase
      .from("content_drafts")
      .select("id,status,created_by")
      .eq("id", id)
      .maybeSingle();

    if (readError) return NextResponse.json({ error: "Unable to verify draft" }, { status: 500 });
    if (!existing || existing.created_by !== auth.user.id) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Only drafts can be edited here; send reviewed content back to draft first" }, { status: 409 });
    }

    const { data, error } = await auth.supabase
      .from("content_drafts")
      .update(values)
      .eq("id", id)
      .eq("created_by", auth.user.id)
      .eq("status", "draft")
      .select(DRAFT_COLUMNS)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Unable to save draft" }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Draft changed; reload and try again" }, { status: 409 });
    return NextResponse.json({ draft: data, saved: true });
  }

  // content_drafts requires an opportunity. Create an internal editorial record first,
  // then attach the draft; clean up the opportunity if draft creation fails.
  const { data: opportunity, error: opportunityError } = await auth.supabase
    .from("content_opportunities")
    .insert({
      keyword,
      normalized_keyword: keyword.toLocaleLowerCase(),
      intent,
      opportunity_type: "article",
      search_count: 0,
      result_count: 0,
      status: "draft",
      title,
      slug,
    })
    .select("id")
    .single();

  if (opportunityError || !opportunity) {
    return NextResponse.json({ error: "Unable to create draft record" }, { status: 500 });
  }

  const { data, error } = await auth.supabase
    .from("content_drafts")
    .insert({
      ...values,
      opportunity_id: opportunity.id,
      content_type: "article",
      created_by: auth.user.id,
    })
    .select(DRAFT_COLUMNS)
    .single();

  if (error || !data) {
    await auth.supabase.from("content_opportunities").delete().eq("id", opportunity.id);
    return NextResponse.json({ error: "Unable to save article draft" }, { status: 500 });
  }

  return NextResponse.json({ draft: data, saved: true }, { status: 201 });
}
