# AGRIVA Category SEO Manager — Technical Design

**Status:** Design only; no schema or Production changes are included.
**Scope:** Marketplace categories and subcategories, Bengali (bn-BD) and English (en).
**Existing Admin surface:** /admin/categories remains the taxonomy source of truth.

## 1. Current-state findings

- product_categories and product_subcategories are the catalogue taxonomy. Product records carry category_slug and subcategory_slug; public routes currently resolve labels and descriptions from the static taxonomy module.
- /admin/categories already manages category name, slug, description, active status and sort order through the guarded admin_save_product_category RPC. It is taxonomy management, not an SEO content editor.
- Category and subcategory public routes have canonical metadata and CollectionPage/Breadcrumb JSON-LD, but no persisted locale-specific title, meta description, intro/body or FAQ editor.
- Sitemap category URLs are derived from active Marketplace product rows. Keep this guard; do not add empty or thin taxonomy pages to the sitemap.
- A read-only Production catalog inventory (2026-11-04) found no category-specific SEO table in the inspected non-system schemas. `product_categories` and `product_subcategories` contain taxonomy identity, labels, descriptions, active state and sort order; they do not contain locale-specific SEO copy. `content_drafts.meta_title` and `meta_description` belong to the article CMS, while `products` contains product-level SEO fields; neither is a safe substitute for category-scoped content.
- Product SEO stabilization found and fixed three issues on the feature branch: category indexability counted active products without restricting to the Marketplace channel; transient catalogue lookup errors were treated as noindex; and product-description word-boundary truncation used an incorrectly escaped whitespace regex.

## 2. Data model proposal

Create public.marketplace_category_seo only after the full schema/migration inventory confirms no compatible existing table.

| Column | Type | Rule |
|---|---|---|
| id | uuid | Primary key, generated |
| category_slug | text | Required FK to product_categories(slug) |
| subcategory_slug | text nullable | If set, composite FK to product_subcategories(category_slug, slug) |
| locale | text | Check constraint: bn-BD or en |
| name_override | text nullable | Optional display label; default to taxonomy label |
| seo_title | text | Required for publish; max 70 characters recommended |
| meta_description | text | Required for publish; max 160 characters recommended |
| intro | text | Useful category introduction |
| body | text | Optional long-form editorial copy |
| faqs | jsonb | Array of 0–8 validated question/answer objects |
| social_image_url | text nullable | Optional public image URL |
| status | text | draft, review, approved, published, rejected |
| created_by, updated_by, reviewed_by | uuid nullable | Actor attribution |
| created_at, updated_at, published_at, reviewed_at | timestamptz | Lifecycle timestamps |

Use two partial unique indexes to handle nullable subcategory scope safely:
- Unique (category_slug, locale) where subcategory_slug IS NULL.
- Unique (category_slug, subcategory_slug, locale) where subcategory_slug IS NOT NULL.

Add a check ensuring a subcategory slug belongs to its parent category. Do not use a global slug field for the content record; existing taxonomy slugs remain the public URL identity.

## 3. Permissions and workflow

- Enable RLS.
- Anonymous SELECT: published content only, limited to public rendering columns. Do not grant public access to actor IDs or editorial timestamps.
- Authenticated Admin SELECT/INSERT/UPDATE: use the established server-side Admin capability boundary and explicit column grants. Do not rely on hidden UI controls as authorization.
- Suggested capabilities: catalog.read for view; catalog.edit for draft/create/edit/review submission; content.publish (or a separately approved catalog.publish) for approve/publish/reject. Confirm the actual capability matrix and grant sources before migration.
- Enforce allowed state transitions in a guarded RPC or database trigger, with reviewer identity bound to auth.uid(); record before-images in an audit/revision table or existing Admin audit facility.
- Publishing a category SEO record must not activate an inactive category or bypass product indexability checks.
- Unpublishing must immediately remove public content from rendering and restore safe taxonomy fallback behavior.

## 4. Admin UX

Extend the existing Categories area; do not create a second taxonomy manager.

- Add a clear “SEO content” action per category and subcategory.
- Locale tabs: Bengali (bn-BD) and English (en); each locale has its own draft/review/publish state.
- Fields: SEO title, meta description, intro, body, FAQ repeater (maximum 8), optional social image, preview.
- Show editorial checks (character counts, missing fields, FAQ validation, duplicate title warning) as completeness guidance, never as a Google ranking score.
- Show catalogue state separately: active Marketplace product count, empty/thin warning, indexability decision and why.
- Save draft and submit for review are separate from approve/publish.
- Display last editor/reviewer and timestamps to authorized Admins.

## 5. Public rendering and locale policy

- Bengali route remains /marketplace/category/[categorySlug] and its current nested subcategory route; do not change existing URLs.
- Add English category routes under /en/marketplace/category/[categorySlug] and matching nested route only when the site locale routing conventions are confirmed and a complete English translation is published.
- For each locale, emit a self-canonical URL. Emit reciprocal hreflang (bn-BD and en) only when both published locale variants exist and are indexable. Never point an English translation's canonical to the Bengali page.
- Use published localized copy when present; otherwise fall back to current taxonomy copy in Bengali. Do not generate an English page from Bengali fallback and label it translated.
- JSON-LD CollectionPage/Breadcrumb content must match visible localized page text.
- Keep the existing active Marketplace product guard. A category with no active Marketplace listings remains noindex and excluded from sitemap. If the catalogue lookup fails transiently, do not issue a false noindex; preserve canonical metadata and log/monitor the uncertain indexability result.
- Do not expose sample products in Production or include preview/sample-only content in metadata.

## 6. Sitemap and cache behavior

- Continue deriving category and subcategory sitemap entries from active Marketplace products, not from draft SEO rows.
- A published SEO row alone does not make an empty category indexable.
- Use category content updated_at as lastModified only after a route is eligible for sitemap inclusion; otherwise use the latest relevant product timestamp or current fallback.
- Revalidate the affected public category route, nested route, sitemap and Admin detail after a publish/unpublish mutation.

## 7. Migration and implementation sequence

1. Re-run full Production catalog inventory and migration-file/history comparison; inspect all possible category/content tables and existing helper functions.
2. Verify catalog.read, catalog.edit, publish capability names and RLS/grant conventions from the live schema.
3. Implement the migration on an isolated Supabase development branch; validate forward apply, rollback/forward repair, RLS as anon/authenticated Admin/non-Admin, unique-index conflicts and workflow transitions.
4. Implement Admin editor and server-side actions/RPC with regression tests.
5. Implement public locale reader and Bengali route integration with static fallback.
6. Add English category routes only after English content records and locale route conventions are ready.
7. Add hreflang, sitemap metadata timestamps and cache revalidation after both locale routes pass QA.

## 8. Acceptance tests

- Both locale rows can coexist for one category/subcategory; duplicate locale rows are rejected.
- Subcategory rows cannot reference a different parent category.
- Anonymous can read only published public fields; non-Admin cannot write; Admin actions require the intended capability.
- Draft/review/approved/published/rejected/unpublish transitions are validated and audited.
- Category and subcategory page render the correct locale copy and self-canonical.
- Hreflang is absent when either translation is missing/unpublished/noindex; reciprocal when both are eligible.
- Active Marketplace products control indexability; Plant Market-only products do not.
- Temporary product catalogue query failure does not noindex a potentially valid category.
- Empty categories remain noindex and absent from sitemap.
- JSON-LD matches visible copy and FAQ.
- Existing Bengali URLs, taxonomy labels and product category assignments remain unchanged.

## 9. Explicit non-goals

- No Production DDL, data mutation, grants or Auth changes.
- No taxonomy slug renaming or product reassignment.
- No auto-translation, AI mass generation, auto-publish or keyword stuffing.
- No claim that title/description character limits guarantee search ranking.


## 10. Production catalog preflight — 2026-11-04 (read-only)

The following checks were performed against the Production project using read-only catalog queries; no DDL, data writes, grants, migration-history edits or deployment occurred.

- No category-specific SEO table or locale-scoped category content columns were found in the inspected non-system schemas.
- `public.product_categories` is the category taxonomy source of truth: `id`, `name`, `slug`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`.
- `public.product_subcategories` is the subcategory taxonomy source of truth: `category_slug`, `slug`, `name`, `description`, `is_active`, `sort_order`, timestamps.
- `public.content_drafts` has `meta_title` and `meta_description`, but these are article-CMS fields with a different lifecycle and ownership model; do not repurpose them for category SEO.
- `public.products` has product-level SEO fields and category/subcategory foreign keys; these are not category editorial content.
- Production migration history returned 102 records, while the checked-out repository contains 112 migration files. The history includes legacy timestamp aliases/replay entries for checkout migrations (including the atomic cart checkout and legacy RPC revoke migrations). These counts and filename similarities do not prove which unmatched DDL is applied. The content-level reconciliation of unmatched files/history rows and six previously identified ambiguous replay groups remains a release blocker.
- The candidate `public.marketplace_category_seo` table therefore remains a proposal, not an approved migration. Before DDL, complete the migration-content comparison, confirm all relevant RLS/grant conventions and validate on an isolated Supabase development branch.

**Decision:** continue with the existing taxonomy tables as the identity layer and keep category SEO content separate. Do not reuse article CMS fields or product SEO columns, and do not create/apply the proposed table in Production during this phase.
