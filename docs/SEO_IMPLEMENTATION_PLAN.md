# AGRIVA SEO Implementation Plan

**Decision:** Combined scope (Products + Categories + Content CMS)  
**Content languages:** Bengali + English  
**Execution mode:** Technical plan followed by branch-only implementation and validation.  
**Target branch:** `feat/admin-control-center-architecture-v1`  
**Related PR:** #217 (draft; do not merge or deploy without explicit approval)

## 1. Executive recommendation

Extend the existing Admin Control Center rather than creating a separate SEO application. Reuse the existing product SEO editor, taxonomy, content drafts, publishing workflow, canonical metadata, sitemap and slug-history work. Prioritize gaps in this order:

1. Verify and stabilize the existing Product SEO and CMS publishing foundations.
2. Add a database-backed, bilingual Category SEO manager and enrich category landing pages.
3. Make Content Studio genuinely bilingual and connect its briefs to the existing review/publish workflow.
4. Complete Search Intelligence persistence and later connect Google Search Console.

No Production database changes, migration application, PR merge or Production deployment are authorized by this plan.

## 2. Repository and schema audit snapshot

Inspected on 2026-11-04 from `feat/admin-control-center-architecture-v1` and read-only Production catalog/history checks:

- PR #217 is open, draft and unmerged; base is `main`. The branch is 176 commits ahead at the latest inspected snapshot; confirm live compare before release.
- Product admin already edits SEO title, description, keywords, SEO body, FAQs and image alt text; slug updates use a dedicated audited RPC and redirect-history table.
- Public product detail pages already emit canonical metadata, Open Graph/Twitter metadata, Product JSON-LD and BreadcrumbList. Product/category indexing depends on active catalogue data.
- Category route `/marketplace/category/[categorySlug]` already exists, with taxonomy-backed title/description, canonical, CollectionPage/Breadcrumb structured data and an indexability check. Its SEO copy is currently generated from static taxonomy labels/descriptions; there is no verified per-category bilingual CMS editor in the inspected route.
- Sitemap currently adds category/subcategory URLs only when active products exist, and includes active Marketplace product URLs. Preserve this useful guard.
- Content Drafts already has review/approval/publish controls and revision-history UI. The feature branch includes a forward migration intended to add public published-article reads and revision history.
- Public blog routes merge static articles with published CMS articles through a dedicated anonymous Supabase client. Static articles remain available as a fallback.
- Content Studio currently sends `language: "English"`; its API only distinguishes Bengali vs English and returns a deterministic template (`generatedWith: "template"`), not an AI-generated article.
- Search Intelligence page was using hard-coded seed rows and local-only approve/reject state. A persisted Admin API already reads/writes `content_opportunities`; the UI has now been changed on this branch to use that API, subject to CI verification.
- Migration lineage is not a live mismatch: `005_search_intelligence` creates `search_queries` and the legacy `search_opportunities`; `007_search_opportunity_canonical` creates `content_opportunities` as the canonical opportunity store and explicitly retains the older table for compatibility. Production migration history includes both 005 and 007.
- Read-only Production catalog checks confirmed `search_queries`, `search_opportunities` and `content_opportunities` exist. At inspection, there were 4 aggregated search-query rows and 0 rows in either opportunity table. No query text or user-level data was retrieved for this count check.
- The opportunity UI/API integration and review-attribution changes are branch-only until CI and PR review. No Production writes were performed.
- The CMS publishing/revision and security migrations remain subject to isolated Supabase validation before any release.

This is a code/PR and read-only schema audit, not a live browser or Production release certification. Preview UI was not visually verified.

## 3. Target information architecture

| Page family | Proposed public route | Search intent | Indexing rule |
|---|---|---|---|
| Marketplace root | `/marketplace` | Browse products | Index if useful public catalogue content exists |
| Product | `/marketplace/[slug]` | Product / transactional | Index only active, public Marketplace listings |
| Category | `/marketplace/category/[categorySlug]` | Category / commercial | Index only if category has meaningful active listings and useful unique copy |
| Subcategory | Existing nested category route | Narrow category / commercial | Index only when active listings and unique useful copy exist |
| Educational article | `/blog/[slug]` | Informational | Index approved and published articles only |
| Problem/solution guide | `/guides/[slug]` | Specific farming problem | Index reviewed, useful, source-checked guides only |

Do not create separate thin pages for every keyword. Product, category, article and guide pages must each answer a distinct search intent.

## 4. Bilingual content and URL policy

- Keep existing Bengali URLs stable. Do not rename, transliterate or replace current product slugs as part of SEO work.
- Use explicit locale-aware content records. Recommended initial model: one content entity with locale-specific rows, e.g. `category_seo_content(category_slug, locale, title, meta_title, meta_description, intro, body, faq, status, updated_at)`. Add unique constraint on `(category_slug, locale)`.
- For articles, assess whether a companion translation table (e.g. `content_draft_localizations`) is safer than expanding the current single-language `content_drafts` row. Preserve existing article slugs and revision history.
- Choose a stable English URL convention after route inventory: preferably a parallel `/en/...` route family if AGRIVA's existing locale architecture supports it. Do not emit `hreflang` until both locale variants exist, are indexable, and point to each other.
- For each locale, provide self-canonical URLs; add reciprocal `hreflang` (including `bn-BD` and `en`) only for true translations. Do not canonicalize the English page to Bengali if the English page is a valid independent translation.
- If only one language exists, publish only that locale and do not generate empty or machine-translated placeholder pages.

## 5. Admin experience

### 5.1 Product SEO Manager — harden existing implementation

Reuse current fields and RPCs. Add:
- Bengali/English content completeness and locale preview, only after locale schema is agreed.
- Google-style title/description preview per locale.
- Checklist: unique title, useful description, descriptive image alt, product facts, FAQ quality, category assignment, canonical and indexability.
- Bulk audit/filter views for missing metadata, duplicate titles/slugs, missing alt text and noindex reasons.
- Preview the actual public product route.

Do not use an arbitrary SEO score as a Google ranking prediction. It is an editorial completeness indicator only.

### 5.2 Category Landing Page Manager — first new feature

Add an Admin page under Marketplace/SEO with:
- Category/subcategory selector from the existing taxonomy (do not maintain a second category list).
- Locale tabs for Bengali and English.
- SEO title, meta description, intro/body, FAQ and social image fields.
- Related products, subcategories, guides and internal-link suggestions.
- Draft/review/approved/published lifecycle with actor attribution and audit trail.
- Public preview and indexability reason.
- Empty-category behavior and sitemap inclusion driven by actual active listings plus minimum useful content rules.

Use a dedicated table only after confirming no existing compatible table in live schema and migrations. Enforce Admin-only writes with RLS and least-privilege column grants.

### 5.3 Content Studio + Drafts — complete existing workflow

- Let the editor choose Bengali or English explicitly.
- Make the API validate locale and return the same locale in title, outline, FAQ and metadata.
- Label current deterministic output as a brief/template; do not describe it as AI-generated.
- If an AI provider is later connected, keep output as a draft and record model/provider metadata and source references where appropriate.
- Add a safe “Create draft from brief” path; no direct publish from Content Studio.
- Keep the review → approve → publish workflow and revision before-images.
- Add localization pairing only after locale schema and canonical/hreflang rules are implemented.

### 5.4 Search Intelligence — persisted opportunity workflow

- Use `content_opportunities` as the canonical opportunity model; retain `search_opportunities` only for compatibility until a separately reviewed cleanup.
- Keep the Admin UI connected to the persisted API, with real loading, empty and error states.
- Display source-backed search count, result count, intent, opportunity type and status. Do not show fabricated opportunity scores.
- Record reviewer identity and timestamp on approval/rejection; moving a record into review is not itself a publish action.
- Opportunity approval must not be represented as article publication. Article publishing remains in Content Drafts.
- Search tracking and opportunity generation are separate: tracked search queries do not automatically create opportunities.
- Keep user-level search history private; use aggregate demand only for editorial analysis.
- Later add Google Search Console OAuth/API integration with explicit account consent and scoped storage.

## 6. Data model

| Entity | Purpose | Decision |
|---|---|---|
| `products` | Existing product SEO | Reuse; avoid duplicate SEO table unless localization requires it |
| `content_drafts` | Existing article workflow | Reuse for current default locale |
| `content_draft_revisions` | Editorial before-images | Use only after branch migration is validated |
| `category_seo_content` | Category/subcategory locale-specific copy | Proposed; first verify no existing compatible table |
| `content_draft_localizations` | Per-locale article metadata/body | Proposed alternative to overloading one draft row |
| `content_opportunities` | Canonical search-demand opportunities | Reuse; migration 007 establishes canonical lineage |
| `search_opportunities` | Legacy opportunity table | Retain for compatibility; do not wire new UI to it |
| `seo_audit_results` | Historical technical/editorial audit findings | Later phase; do not add until report retention/use case is defined |
| Search Console metrics | Clicks, impressions, CTR, position, page/query/date | Later phase; store only required, consented account data |

Every new table requires: explicit RLS policies, least-privilege grants, Admin authorization checks, unique constraints, indexes justified by queries, auditability for mutations and migration rollback/forward-repair plan.

## 7. Delivery phases and acceptance criteria

### Phase 0 — preflight and reconciliation
- Confirm exact branch head, PR head, CI run and preview deployment.
- Compare repository migration files with live migration history and catalog definitions; do not infer applied state from filenames.
- Validate CMS publishing/revision and role-grant migrations on an isolated Supabase branch.
- Inspect existing category/subcategory route, taxonomy, indexability and sitemap end-to-end.
- Confirm canonical opportunity lineage (005 → 007) and ensure the Admin UI/API use `content_opportunities`.
- Produce a migration matrix and release/rollback plan.

**Exit:** no unresolved schema ambiguity for the tables/functions touched by Phase 1; smoke tests and build pass; no Production mutation.

### Phase 1 — Product SEO stabilization
- Add regression tests for metadata, canonical, structured data, slug redirects, FAQ validation, alt-text and noindex conditions.
- Improve SEO audit UI and bilingual readiness without changing public URLs.
- Confirm active products only are indexable and sitemap inclusion matches public route eligibility.

**Exit:** existing product SEO data remains intact; redirects/canonical tests pass; no duplicate indexable product URL.

### Phase 2 — Category SEO CMS
- Implement locale-aware category editor and public rendering.
- Add category FAQ/CollectionPage/Breadcrumb schema where visible content supports it.
- Add reciprocal locale alternates only for complete translations.
- Update sitemap and internal links from published, indexable category content.

**Exit:** Admin can save/review/publish both locales; public pages render correct locale metadata/content; unpublished rows are not public; empty/thin categories remain noindex/out of sitemap.

### Phase 3 — CMS localization and editorial UX
- Add locale-aware article editing and preview.
- Complete CMS public read and revision workflow after isolated migration validation.
- Ensure static articles remain available during migration rollout.
- Add source/fact-check checklist and content update dates.

**Exit:** only approved/published article variants are public; locale canonicals and hreflang are reciprocal; unpublish is safe and revision history is preserved.

### Phase 4 — Search Intelligence and measurement
- Complete tests for persisted opportunity listing and state transitions; remove any remaining demo-only behavior.
- Add Search Console integration after OAuth/permissions review.
- Track clicks, impressions, CTR, position and indexed pages by locale/page family.
- Add scheduled audit and actionable issue queue.

**Exit:** every metric has a source and date range; demo values are clearly marked or removed; no personal profiling.

## 8. Required QA matrix

- Bengali-only, English-only and fully translated records.
- Missing translation: no empty locale page and no broken hreflang.
- Draft/review/approved/published/rejected/unpublished states.
- Admin vs non-admin read/write permissions; anonymous published-only article/category reads.
- Duplicate slug/title and locale uniqueness conflicts.
- Product paused/sold-out/draft vs active behavior.
- Category with 0 products, 1 product, and meaningful catalogue.
- Database/network failure: no accidental noindex of valid pages and no false success UI.
- Sitemap contains only canonical, public, indexable URLs.
- Structured data matches visible page content.
- Mobile Admin editing and public page rendering.
- Lint, TypeScript, relevant smoke tests and production build.

## 9. Explicit non-goals for this plan

- No mass AI article generation or auto-publishing.
- No keyword stuffing or doorway pages.
- No Product slug migration or forced URL redesign.
- No Production database DDL/data/grant/Auth changes.
- No merge of PR #217 and no Production deploy.
- No fabricated keyword volume, Google rank, clicks or impressions.

## 10. Latest branch work (2026-11-04)

- SEO-003 review identified three concrete defects and fixed them on the feature branch:
  1. Category/subcategory indexability now counts only active Marketplace-channel products, preventing Plant Market-only listings from making a Marketplace category indexable.
  2. A transient category product-catalogue read failure now returns an unknown indexability result without forcing a false noindex directive. Confirmed empty categories still remain noindex.
  3. Product long-description summaries now use a real whitespace regex for word-boundary truncation instead of matching literal backslash characters.
- Regression assertions were added to the taxonomy and product SEO smoke scripts. Regression test assertion was corrected in commit 1590fde5cf1cedd8061f7a6fa7327063adf41a5b. The earlier code commit 892df56852b56e2d9f7e095a047355d9391c0b83 has a READY Vercel preview; the latest assertion-only commit is queued for preview, and GitHub Actions run #2308 remained queued at the last check, so test pass is not yet certified.
- SEO-004 design is documented in docs/CATEGORY_SEO_MANAGER_DESIGN.md. It proposes a bilingual, locale-scoped category/subcategory content model, Admin lifecycle, public rendering, canonical/hreflang rules, sitemap constraints, RLS and isolated-migration validation. It intentionally does not add a migration or change Production.
- The current /admin/categories route is retained as the taxonomy source of truth; the SEO editor should extend it rather than duplicate taxonomy management.
- Production schema/catalog checks were read-only. No Production DDL, data writes, grants, deployment or PR merge occurred.

## 11. Immediate next tickets

1. `SEO-001`: branch/PR/CI/preview and schema preflight.
2. `SEO-002`: confirm canonical opportunity model and connect persisted Search Intelligence UI/API (implementation now on branch; CI gate pending).
3. `SEO-003`: Product SEO regression test and audit UI acceptance.
4. `SEO-004`: Category SEO schema + Admin editor design (Bengali/English).
5. `SEO-005`: Category public metadata/rendering/sitemap/hreflang.
6. `SEO-006`: bilingual Content Studio and CMS localization.
7. `SEO-007`: Search Intelligence measurement + Search Console integration.

**Recommended next implementation after the current CI pass:** SEO-003 and SEO-004. Do not start category schema migration until all related live schema checks and isolated-branch validation are complete.
