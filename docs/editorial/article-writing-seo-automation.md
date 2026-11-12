# AGRIVA editorial automation: draft-first SOP

## Goal
Produce accurate, useful Bengali agricultural articles for Bangladesh readers with measurable SEO hygiene, while keeping production publication human-approved.

## Pipeline
1. Research the reader's intent, crop variety, Bangladesh region/season, keyword cluster, and current authoritative sources. Prefer DAE/BAMIS, BARI, BARC, AIS and peer-reviewed research. Record exact URLs, publication dates and conflicting guidance.
2. Draft original Bengali content with a natural H1, concise answer in the introduction, logical H2/H3 sections, practical steps, safety caveats, FAQs only when useful, and clearly marked source list. Never fabricate yield claims, expert identities, images or citations.
3. Save as `content/articles/drafts/NNN-slug.md` with the metadata fields already used by draft #001. Choose unique English ASCII slug, human-friendly Bengali SEO title and meta description, and specific Bengali alt text.
4. Run `node scripts/audit-editorial-drafts.mjs`. Failures block PR; warnings require editorial attention. CI automatically runs the same audit on relevant PR changes.
5. Produce a crop-accurate hero, target 1600x840 WebP, verify actual pixels, file size, visual details and usage rights. Add image file only after it is physically generated and inspected; a filename in Markdown is not an uploaded asset.
6. Review all factual claims against their sources, including fertilizer/chemical doses, units, variety and local applicability. Validate every internal link target. Review mobile layout, image loading, accessibility, metadata, canonical, schema and sitemap behavior in staging.
7. Preview is admin-only on Vercel Preview; no auto-publication. Supabase draft insertion and production deployment require separate approval and integration tests.

## Automated checks versus manual gates
- Automated: metadata presence and length, keyword in title, slug format, headings, references present, hero alt/filename, explicit draft status, CI regression checks.
- Human review: truthfulness of sources, originality, search intent, useful detail, SEO competitiveness, internal-link destinations, actual hero file properties/rights, author identity, accessibility, correct canonical and structured data, compliance with Google policies.
- A passed lint is **not** a publication approval or guarantee of ranking/Discover inclusion.

## Editorial safety
No automatic publishing, production migrations, or bulk insertions. Keep source drafts in GitHub until the requested batch is ready for staging review. Production merge only after backup, RLS/auth integration tests, staging checks, and explicit approval.
