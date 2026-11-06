# AGRIVA Phase 3 — Growth, SEO & Analytics Acceptance Criteria

**Planning date:** 2026-11-06  
**Status:** Specification only; no production publishing, indexing or analytics settings changed.

## 1. Outcomes

1. Every public product and editorial page has one canonical URL and deterministic metadata.
2. Search engines can index only intentional public content; drafts, review queues and private seller data remain private.
3. Editors can move content from search opportunity to draft, review, approval, publication and unpublication with an attributable revision trail.
4. Sitemap and redirect behavior is testable and does not expose private or unpublished records.
5. Analytics has one documented source of truth for traffic, search demand, content performance and marketplace conversion.

## 2. Feature acceptance criteria

### A. Technical SEO control plane

**Status:** Missing / Partial across existing route capabilities.

- [ ] Admin can inspect canonical URL, indexability, robots directives and sitemap inclusion for each supported public route type.
- [ ] Canonical URLs are absolute, stable, self-referencing by default and normalized for trailing slash/query parameters.
- [ ] Draft, review, rejected and private seller content returns an intentional noindex/authorization response and is excluded from sitemap.
- [ ] Published articles and active approved products have exactly one canonical URL.
- [ ] Metadata preview shows title, description, canonical, Open Graph and structured-data output before save.
- [ ] Metadata validation warns on empty/duplicate title, empty/duplicate description, malformed canonical and invalid slug.
- [ ] Changes record actor, timestamp, entity and previous/new values in the audit log.
- [ ] Search Console verification and sitemap submission are documented; credentials/tokens are never displayed in Admin UI.

### B. Redirect manager

**Status:** Partial — product slug history has a migration/RPC design; no complete redirect manager.

- [ ] Admin can create, inspect, search, disable and resolve 301 redirects.
- [ ] Redirect source is unique and cannot create loops or chains beyond an agreed limit.
- [ ] Redirect destinations must resolve to an allowed AGRIVA canonical route; external redirects require a separate explicit policy.
- [ ] Product slug changes create an immutable old-slug mapping in the same transaction as the slug update.
- [ ] Public requests to old slugs return one permanent redirect to the current canonical slug.
- [ ] 404 and redirect metrics identify broken destinations without exposing user data.
- [ ] Every redirect mutation is permission-gated and audited.

### C. Product SEO

**Status:** Partial — metadata/alt text fields exist; complete indexability workflow is not proven.

- [ ] Product editor supports SEO title, description, canonical override only when policy allows, image alt text and indexability status.
- [ ] Product status and seller visibility rules take precedence over SEO settings: draft/suspended/private products cannot be indexed.
- [ ] Category/subcategory pages have unique metadata and canonical paths.
- [ ] Product structured data uses verified database price, currency, availability and canonical URL; no fabricated review/rating claims.
- [ ] Bulk metadata preview/export is available before any bulk write.
- [ ] Slug changes preserve redirects and never silently break existing links.

### D. Editorial workflow and publishing

**Status:** Partial — persistent `content_drafts` and separate `article_drafts` workflows exist; Content Studio brief generation remains non-persistent.

- [ ] Search opportunity can create a persistent content draft with a stable opportunity reference.
- [ ] Draft creation is idempotent or warns on an existing draft for the same opportunity/type.
- [ ] Content draft states have an explicit transition graph: draft → review → approved → published; rejected content returns to draft; published content must be unpublished to review before edits.
- [ ] Every transition checks `content.edit` or `content.publish` server-side and records the acting user.
- [ ] Publication validates title, slug, body, metadata, source references, factual claims and duplicate slug.
- [ ] Publication and sitemap revalidation happen only after the database transaction succeeds.
- [ ] Unpublish removes the public page from sitemap and returns a deliberate noindex/404/redirect response.
- [ ] Before-images are retained in revision history and readable only by authorized reviewers.
- [ ] AI-generated material is always marked as a draft and requires human review; no auto-publish.
- [ ] Source/claim review checklist is mandatory for agronomic, safety, health, pesticide, fertilizer and regulatory claims.

### E. Analytics and reporting

**Status:** Partial — bounded reports and search aggregates exist; no unified analytics pipeline was proven.

- [ ] Define event taxonomy for page view, internal search, product view, add-to-cart, checkout start, order completion and content engagement.
- [ ] Assign one canonical event ID and deduplicate client/server events.
- [ ] Avoid collecting raw phone, address, identity evidence, payment credentials or unnecessary user identifiers in analytics payloads.
- [ ] Admin dashboard separates measured values from estimates and displays source, date range, timezone and data freshness.
- [ ] Search opportunity counts derive from persisted event aggregates and show aggregation window/sample size.
- [ ] Content report includes impressions/clicks only when a verified Search Console integration exists; otherwise display unavailable, not zero.
- [ ] Exports are bounded, permission-gated, logged and PII-minimized.

### F. Growth workflow governance

- [ ] Assign clear owners for opportunity triage, content drafting, editorial review, publication and SEO monitoring.
- [ ] Add queue aging, reviewer attribution and stale-content alerts.
- [ ] Add content quality checks for duplicate topics, internal-link validity, source freshness and local relevance.
- [ ] Provide rollback/unpublish procedures and a documented incident path for incorrect or unsafe content.
- [ ] Every integration failure has a visible unavailable state and safe retry path.

## 3. Dependencies and release gates

1. Finish P0 security items in `ADMIN_SECURITY_REVIEW.md`.
2. Confirm `content_drafts`, `article_drafts`, revisions, published article reader and public RLS behavior in an isolated Supabase branch.
3. Agree on the canonical editorial entity/workflow before merging the separate `content_drafts` and `article_drafts` concepts. Do not merge tables without a data migration and rollback plan.
4. Verify canonical metadata and sitemap output on a Preview build.
5. Test redirects, unpublished content, duplicate slugs and indexability using automated route-level tests.
6. Require explicit release approval before production migrations, Search Console credential changes, indexing policy changes or publication of content.

## 4. Definition of done

Phase 3 is complete only when acceptance tests prove the public behavior and permission boundaries, editorial state transitions are auditable and reversible, canonical/sitemap/redirect output is correct, and analytics reports distinguish unavailable data from zero. A UI-only implementation does not satisfy these criteria.
