import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import { auditSeoArticle } from "@/lib/seo/article-audit";

export async function POST(request: NextRequest) {
  const access = await requireAdminApi("content.read");
  if (!access.ok) return access.response;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid article input" }, { status: 400 });
  }
  const fields = body as Record<string, unknown>;
  const keys = ["title", "metaTitle", "metaDescription", "primaryKeyword", "content"] as const;
  if (keys.some(key => typeof fields[key] !== "string")
    || (fields.title as string).length > 250
    || (fields.metaTitle as string).length > 250
    || (fields.metaDescription as string).length > 1000
    || (fields.primaryKeyword as string).length > 160
    || (fields.content as string).length > 100000) {
    return NextResponse.json({ error: "Invalid article fields or size limits exceeded" }, { status: 400 });
  }
  return NextResponse.json(auditSeoArticle({
    title: fields.title as string, metaTitle: fields.metaTitle as string,
    metaDescription: fields.metaDescription as string,
    primaryKeyword: fields.primaryKeyword as string, content: fields.content as string,
  }));
}
