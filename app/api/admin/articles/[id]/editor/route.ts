import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import { auditSeoArticle } from "@/lib/seo/article-audit";
import { reviewClaimEvidence, type ClaimEvidence } from "@/lib/seo/claim-review";

const statuses = ["draft", "review", "approved", "published", "rejected"] as const;
type Status = typeof statuses[number];
const transitions: Record<Status, Status[]> = {
  draft: ["review"], review: ["draft", "approved", "rejected"],
  approved: ["review", "published"], published: ["review"], rejected: ["draft"],
};
const clean = (value: unknown, limit = 1000) => typeof value === "string" ? value.trim().slice(0, limit) : "";
const validUrl = (value: string) => { try { const u = new URL(value); return u.protocol === "https:" && !!u.hostname.includes("."); } catch { return false; } };
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { data: current, error: readError } = await access.supabase.from("content_drafts")
    .select("id,status,title,slug,meta_title,meta_description,primary_keyword,body_markdown,author_name,reviewer_name,hero_image_url,hero_image_width,hero_image_height,hero_image_alt,hero_image_license,hero_image_rights_note,hero_image_verified_by,hero_image_verified_at,claim_evidence")
    .eq("id", id).eq("content_type", "article").maybeSingle();
  if (readError || !current) return NextResponse.json({ error: "Article unavailable or migration missing" }, { status: 404 });
  const data = body as Record<string, unknown>;
  const next = clean(data.nextStatus, 20) as Status;
  const status = current.status as Status;
  if (!statuses.includes(next) || (next !== status && !transitions[status]?.includes(next))) return NextResponse.json({ error: "Invalid editorial status transition" }, { status: 400 });
  if (next === "approved" || next === "published") {
    const publicationAccess = await requireAdminApi("content.publish");
    if (!publicationAccess.ok) return publicationAccess.response;
  }
  const author = clean(data.authorName, 160);
  const reviewer = clean(data.reviewerName, 160);
  const reviewerIdentity = clean(access.profile.full_name, 160);
  if (next === "approved" && (!reviewerIdentity || reviewer !== reviewerIdentity)) {
    return NextResponse.json({ error: "Reviewer name must match your verified admin profile before approval" }, { status: 422 });
  }
  const alt = clean(data.heroImageAlt, 250);
  const license = clean(data.heroImageLicense, 150);
  const rights = clean(data.heroImageRightsNote, 1500);
  const url = clean(data.heroImageUrl, 1500);
  const expectedStorageBase = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "") + "/storage/v1/object/public/article-hero-images/";
  const width = Number(data.heroImageWidth);
  const height = Number(data.heroImageHeight);
  const claims = data.claimEvidence;
  if (!Array.isArray(claims) || claims.length > 100 || claims.some(x => !x || typeof x !== "object"
    || typeof x.claim !== "string" || x.claim.length > 1000 || typeof x.source_url !== "string"
    || x.source_url.length > 1500 || typeof x.verification_note !== "string"
    || x.verification_note.length > 2000 || typeof x.verified !== "boolean")) {
    return NextResponse.json({ error: "Invalid claim evidence" }, { status: 400 });
  }
  const claimReview = reviewClaimEvidence(claims as ClaimEvidence[]);
  const publishing = next === "published" && status !== "published";
  if (publishing && (!author || !reviewer || !alt || !license || !rights || !validUrl(url)
    || !process.env.NEXT_PUBLIC_SUPABASE_URL || !url.startsWith(expectedStorageBase)
    || !Number.isInteger(width) || width < 1200 || !Number.isInteger(height) || height < 630
    || !data.imageRightsConfirmed || !data.authorIdentityConfirmed || !data.sourceReviewConfirmed
    || !claimReview.readyForEditorialReview)) {
    return NextResponse.json({ error: "Publication blocked: verified byline, reviewed claims, hosted high-resolution image and rights confirmation required", issues: claimReview.issues }, { status: 422 });
  }
  const storedClaims = Array.isArray(current.claim_evidence) ? current.claim_evidence as ClaimEvidence[] : [];
  const evidenceUnchanged = claims.length === storedClaims.length && claims.every((claim, index) => {
    const previous = storedClaims[index];
    return previous && claim.claim === previous.claim && claim.source_url === previous.source_url
      && claim.verified === previous.verified && claim.verification_note === previous.verification_note;
  });
  const editorialChanged = author !== current.author_name || reviewer !== current.reviewer_name
    || url !== current.hero_image_url || width !== current.hero_image_width || height !== current.hero_image_height
    || alt !== current.hero_image_alt || license !== current.hero_image_license
    || rights !== current.hero_image_rights_note || !evidenceUnchanged;
  if (status === "approved" && next === "approved" && editorialChanged) {
    return NextResponse.json({ error: "Approved evidence is locked. Return to review before editing editorial metadata" }, { status: 409 });
  }
  if (publishing && (author !== current.author_name || reviewer !== current.reviewer_name
    || url !== current.hero_image_url || width !== current.hero_image_width || height !== current.hero_image_height
    || alt !== current.hero_image_alt || license !== current.hero_image_license
    || rights !== current.hero_image_rights_note || !evidenceUnchanged)) {
    return NextResponse.json({ error: "Save verified editorial metadata before publishing; publication cannot alter evidence" }, { status: 422 });
  }
  if (publishing && !current.hero_image_verified_by) {
    return NextResponse.json({ error: "Save and verify editorial metadata before publishing" }, { status: 422 });
  }
  if (publishing) {
    const audit = auditSeoArticle({ title: current.title, metaTitle: current.meta_title || "",
      metaDescription: current.meta_description || "", primaryKeyword: current.primary_keyword || "",
      content: current.body_markdown || "" });
    if (audit.failures) return NextResponse.json({ error: "Resolve critical SEO/evidence checks before publishing", audit }, { status: 422 });
  }
  const update: Record<string, unknown> = { status: next };
  if (next === "approved") update.reviewer_name = reviewerIdentity;
  if (status !== "published") {
    Object.assign(update, {
      author_name: author, reviewer_name: reviewer,
      hero_image_url: url || null, hero_image_width: width || null, hero_image_height: height || null,
      hero_image_alt: alt, hero_image_license: license, hero_image_rights_note: rights,
      claim_evidence: claims,
      author_verified_by: data.authorIdentityConfirmed ? access.user.id : null,
      hero_image_verified_by: data.imageRightsConfirmed ? access.user.id : null,
      hero_image_verified_at: data.imageRightsConfirmed ? new Date().toISOString() : null,
    });
  }
  const { data: saved, error } = await access.supabase.from("content_drafts")
    .update(update).eq("id", id).eq("status", status).select("id,status,published_at").maybeSingle();
  if (error || !saved) return NextResponse.json({ error: "Save failed; check workflow permissions and database migration" }, { status: 409 });
  return NextResponse.json({ article: saved, claimReview });
}
