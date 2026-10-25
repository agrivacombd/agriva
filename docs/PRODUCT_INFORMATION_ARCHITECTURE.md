# AGRIVA Product Information Architecture & URL Masterplan

Last updated: 2026-10-25

## Goals

- Make AGRIVA easy to navigate for farmers on mobile first, without making desktop workflows feel cramped.
- Keep one stable, descriptive URL per feature; avoid duplicate pages that compete in search.
- Organize features around user jobs-to-be-done: get farming help, plan a crop, buy/sell, manage a farm, and find work.
- Only index public, useful pages. Private workspaces and query-driven search results should not be SEO landing pages.
- Do not promise live inventory, job availability, weather accuracy, or AI diagnosis unless the data/service supports it.

## Primary navigation and ranking

### Home page
1. Hero smart search: /search (main discovery entry point).
2. Core farming support: /ai, /crop-disease, /weather.
3. Inputs and decisions: /marketplace, /market-prices, /crop-calendar, /tools, /soil-fertilizer, /crop-choice.
4. Farm work: /farms (personal workspace; do not index).
5. Commerce and logistics: /sell-harvest, /buyer-demands, /transport.
6. Learning: /learn.
7. Careers: /jobs and /jobs/cv-builder in a dedicated career section and quick access.

The homepage services grid is ordered by common, high-value farming tasks. Career features remain in a separate section so they are visible without displacing core farming support. The mobile bottom navigation is intentionally limited to five items: Home, Search, Tools, Jobs, Marketplace. Disease support, weather, farm records and learning remain available through the homepage and tools directory.

## Canonical URL and page map

| User need | Canonical URL | Page/slug rule | Indexing |
|---|---|---|---|
| Home / discover | / | One homepage only | Index |
| Smart search | /search | Search terms are query/form input, not new landing-page slugs | Noindex/disallow crawl |
| AI agriculture assistant | /ai | Keep stable short slug | Index only if useful public content is rendered |
| Crop disease support | /crop-disease | One disease-help entry point; do not create duplicate /disease | Index |
| Weather | /weather | Location selection stays in the UI; do not generate thin URL variants | Index |
| Agriculture marketplace | /marketplace | Main marketplace landing page | Index |
| Product details | /marketplace/{product-slug} only if the matching dynamic route exists and the product is active/approved | Lowercase, hyphenated, stable, unique slug; no IDs or tracking params | Index active approved products only |
| Market prices | /market-prices | Landing page links to dated/official source; do not fabricate daily prices | Index |
| Farm tools directory | /tools | Directory for calculators and planning tools | Index |
| Crop calendar | /crop-calendar | One calendar page; saved state stays local/user-specific | Index |
| Crop choice comparison | /crop-choice | One simulator page; user inputs do not become indexable URLs | Index |
| Soil/fertilizer planner | /soil-fertilizer | One planner page; recommendations depend on report/advice entered | Index |
| Farm workspace | /farms | Personal records, not public farm pages | Noindex; protect user data |
| Learning centre | /learn | Lessons can later use /learn/{lesson-slug} only when each lesson has unique, reviewed content | Index |
| Blog | /blog | Article detail uses /blog/{article-slug}; only published/reviewed articles are indexable | Index published content only |
| Jobs marketplace | /jobs | Main job search and posting entry point | Index |
| Job details | /jobs/{job-slug} | Existing job slug; lowercase hyphenated, unique, stable; expired/unpublished jobs must not stay indexable | Index published, open jobs only |
| CV Builder | /jobs/cv-builder | Keep nested under jobs; do not add competing /cv-builder or /career/cv aliases | Index |
| Sell harvest | /sell-harvest | Seller flow and public offers only when offer pages are actually supported | Index landing page; review offer detail routes separately |
| Buyer demand board | /buyer-demands | Public demand board; private contact details must be protected | Index landing page |
| Transport | /transport | Booking/request flow; personal booking details stay private | Index landing page only |
| Dashboard | /dashboard | Authenticated user workspace | Noindex/private |
| Admin | /admin/* | Staff-only | Noindex/private |
| Auth and orders | /auth/*, /orders | Transactional/private | Noindex/private |

## Slug rules

- Use lowercase Latin characters and hyphens for stable public slugs; use Bengali in page copy and titles, not in URL paths.
- Keep URLs short and intent-led: /jobs/cv-builder, not /tools/cv-making-tool-free-bangladesh.
- Do not rename existing routes solely for keyword stuffing. If a route must change, add a permanent redirect from the old URL, update canonical/internal links/sitemap, and verify the redirect chain.
- Job and product detail slugs must be unique and immutable after publication where possible. If a title changes, retain the old slug or redirect it.
- Do not put user-entered search terms, personal data, phone numbers, or IDs in public URLs.
- Use one canonical host (https://agriva.com.bd), HTTPS, self-referencing canonicals, and consistent trailing-slash behavior.

## SEO and publishing rules

- Sitemap contains indexable static landing pages plus only active/approved products, published/open jobs, and published articles.
- Do not include private workspaces, search results, drafts, rejected articles, expired jobs, or unapproved product records.
- CV Builder has page-level metadata and a canonical URL. CV content must remain local/private unless a user explicitly exports or shares it.
- Keep job detail metadata and JobPosting structured data synchronized with actual publication/deadline state; remove expired jobs from the sitemap.
- Blog landing page must list real published articles before it is promoted as an active content hub. A placeholder page should not be used to imply that articles are already available.
- Marketplace sample/preview products must never look like real purchasable inventory.
- Use breadcrumbs and contextual links: Home → category/section → detail. Every important page should have a clear route back to its parent.
- Validate sitemap and robots output in production after deployment; robots rules do not replace authentication or database security.

## UX rules

- Mobile bottom navigation has five high-frequency destinations; keep labels short and tap targets large.
- Desktop top navigation should expose the main destinations, with tools and career links grouped logically.
- Use descriptive link text (e.g. “কৃষি চাকরি খুঁজুন”, “CV তৈরি করুন”), not generic “Click here”.
- Group related tools by task and avoid repeating the same cards in several sections unless the repeated shortcut serves a different journey.
- Show empty states when no approved products/jobs exist; do not fill production with fake availability.
- Make language, data freshness, source, and AI limitations clear where relevant.
- Keep forms short, preserve user input after validation errors, and make mobile keyboards appropriate to the field.


## Account model and role-based onboarding

Use one authentication system and one identity per person; do not force users to create separate logins for every role. After sign-up, ask what they want to do and allow a user to hold multiple roles where justified. A farmer may also sell produce, hire workers, or apply for jobs. Role switching must not create duplicate profiles or bypass permissions.

Suggested onboarding choices:
- Farmer / farm manager
- Seller / agricultural input dealer
- Buyer / wholesaler / processor
- Job seeker / agricultural worker
- Employer / farm or agribusiness
- Agriculture expert / educator
- Transport provider
- Organization / cooperative (optional, with organization membership and invite flow)

Implementation rules:
- Keep authentication identity separate from public profile and role memberships.
- Use server-validated role membership and database row-level security; never trust a role supplied only by a URL or client form.
- Collect only the information needed for the selected journey, with progressive onboarding and the ability to skip non-essential fields.
- Ask for organization details only when an organization role is selected; add organization owner/admin/member permissions only when the data model and policies are ready.
- Let users edit profile visibility and contact preferences. Never expose private phone, email, CV, farm records, applications, or orders in public pages by default.
- Do not add an administrator option to public sign-up. Admin access must be granted separately by an authorized process.
- Use account type to personalize dashboards and recommendations, not to hide public pages from users who have another role.
- Keep role-specific verification and trust badges explicit; never imply verification without a completed review.

## Draft, review, publish, and revision workflow

All editorial content and moderated user-generated listings need an explicit lifecycle. Use a shared state model where appropriate, while keeping domain-specific permissions separate.

Suggested states:
- Draft: private to author and authorized editors.
- In review: submitted for editorial/moderation review; author edits are controlled and changes may require resubmission.
- Changes requested: feedback is recorded and the author can revise.
- Approved: reviewed and ready to publish, but not public until publication is explicitly triggered or a scheduled time is reached.
- Published: public, canonical, internally linked, and eligible for sitemap only if the content type is indexable.
- Unpublished / archived: no longer promoted publicly; remove from sitemap and choose 404, 410, or a relevant redirect based on whether a replacement exists.
- Rejected: private with a recorded reason; not indexable.

Required capabilities:
- Autosave and explicit Save Draft.
- Preview using the same typography/layout as the public page, with no accidental indexing.
- Draft/review/publish permissions enforced on the server and in database policies.
- Author, reviewer, publisher, timestamps, revision history, and moderation/audit trail.
- Validation for required fields, slug uniqueness, metadata, image alt text, internal links, and content type before publishing.
- Schedule/publish/unpublish only when a reliable scheduler and permissions exist; otherwise expose a clear manual workflow rather than a fake scheduling control.
- A failed publish must preserve the draft and display an actionable error.
- Publishing should invalidate relevant caches, update canonical/internal links, and update sitemap eligibility.
- Job listings and products have their own expiry/availability rules; publishing an article must not make a job or product public by accident.
- Public routes must fetch only approved/published content. RLS and server-side checks must protect draft records even if a user manually visits a URL.

## Data and entity mapping

Model relationships explicitly rather than duplicating text across pages:
- User identity → profile → role memberships → organization memberships.
- Product → seller → category/subcategory → availability/status → media → product detail URL.
- Job → employer → location → job type → deadline/status → applications.
- Article → author → reviewer → topic/category → related content → revision/publication status.
- Farm → owner/member → fields/crops/seasons → tasks/records.
- Buyer demand → buyer/organization → crop/specification/quantity/location/deadline.
- Transport request → requester → pickup/drop-off → quote/status.
- Every public entity should have a stable slug, lifecycle state, timestamps, and clear owner/permission rules where relevant.

Prefer a normalized source of truth, typed validation at API boundaries, and explicit server-side authorization. Add database migrations and tests before changing schema or enabling new role workflows. Do not make public pages depend on mock/demo inventory or unpublished data.


## Phase 2 account and security audit — 2026-10-25

### Confirmed account model
- Authentication is email/password with email confirmation through `/auth/callback`; current sign-up page does not yet ask for role or purpose.
- The current `profiles.role` enum is single-role (`farmer`, `reseller`, `admin`). This is not sufficient for the intended multi-role Super App.
- New-user profile trigger permits `farmer` or `reseller` from signup metadata and defaults all other values to `farmer`; it does not grant `admin` through signup metadata.
- Recommended target: one identity, one core profile, multiple explicit role memberships, with organization memberships only when needed. Do not replace the existing role model until the new model, authorization rules, migration/backfill and all dependent code are ready.

### Security finding fixed
- The initial audit found that authenticated users had table-level UPDATE privilege on `public.profiles` and the self-update RLS policy only constrained `id = auth.uid()`. That combination could allow a user to attempt changing their own `role` field.
- Added migration `supabase/migrations/20261025164429_secure_profile_role_updates.sql` and applied the equivalent migration to the connected Supabase project.
- The migration revokes table-level UPDATE from `PUBLIC`, `anon` and `authenticated`, then grants authenticated users column-level UPDATE only on `full_name` and `phone`.
- Post-change privilege verification: authenticated table-level UPDATE = false; authenticated role-column UPDATE = false; authenticated full_name/phone UPDATE = true; anon role-column UPDATE = false.
- Privileged role changes must continue through server-authorized admin functions. Do not add client-side role editing.

### Remaining account/security work
- Build role-based onboarding and a role-membership table with explicit constraints, server-side authorization and RLS; support multiple roles without duplicate accounts.
- Add a server-side guard to the content-drafts admin route for a clear UX and defense in depth. Its current database RLS policy is admin-only, but the page itself is a client component without an obvious server authorization gate.
- Review every exposed SECURITY DEFINER function against its intended audience. Supabase advisors report several functions callable by `anon` or `authenticated`; this is a warning requiring per-function review, not proof that each function is exploitable. Keep intentional public RPCs minimal and ensure privileged functions verify the caller inside the function.
- Re-run security and performance advisors after fixes; triage findings individually rather than blanket-revoking legitimate public marketplace/search operations.
- Test signup, email confirmation, login/logout, profile edits, role changes, admin routes, content drafts, job applications and cross-user data access using separate test accounts before release.


### Phase 3 — content workflow and admin access hardening

- Added a server-rendered authorization gate to `/admin/content-drafts`: unauthenticated users are sent to login; non-admin users are sent to the dashboard. The client component is rendered only after the server checks the session and `profiles.role`.
- Confirmed database RLS on `content_drafts` is admin-only for all operations. The draft creation RPC also checks the caller's admin role; do not treat its client-side invocation as authorization.
- Extracted the existing drafts UI into a client component and added editable title, slug, meta title, meta description and Markdown article body.
- Added save-draft, review, approve, reject and publish controls. Publishing is offered only for an approved draft and is blocked unless the title, URL slug and article body pass basic validation. Duplicate slug or database errors are surfaced rather than silently ignored.
- The publish control writes `status = published`, which is the existing publication state used by public article routing; the article is not publicly available until the database update succeeds.
- Remaining: add explicit reviewer attribution/revision history, robust preview rendering, source/citation validation, content sanitization review, slug collision preflight, and end-to-end tests with non-admin/admin accounts. Do not consider the workflow production-ready until preview build and CI pass.


### Phase 4 — published content SEO and discoverability

- Replaced the static empty-state-only blog landing page with a server-rendered list of published article records, safe slug filtering, canonical/Open Graph metadata, and an ItemList JSON-LD block. When no published articles exist, the page gives a helpful empty state and links to learning resources.
- Article detail pages now validate slug format, query only rows with `status = published` and `content_type = article`, provide canonical/description/Open Graph/Twitter metadata, and return not-found for unpublished or missing content.
- Added Article and BreadcrumbList JSON-LD, visible breadcrumb navigation, and a return link to the blog index.
- Tightened sitemap output: article entries must have valid slugs, titles and non-empty bodies; product and job slugs must match the safe lowercase hyphenated format. Existing active/approved product and published/non-expired job filters remain in place.
- These changes are committed to the feature branch. They are not yet verified on a successful preview build or production. Before release, check the actual route behavior, JSON-LD validation, slug uniqueness, published-content RLS and sitemap URLs against live data.

## Implementation checklist

- [x] Keep existing public URLs stable.
- [x] Re-rank homepage tools around core farming needs and put careers in a dedicated section.
- [x] Add jobs and CV Builder to homepage quick access and mobile navigation.
- [x] Add core public tool pages and CV Builder to the sitemap.
- [x] Add page-level metadata/canonical for CV Builder.
- [x] Add homepage Organization and WebSite structured data, including internal SearchAction.
- [ ] Implement and test role-based onboarding with one identity and multiple permitted roles.
- [x] Revoke self-service profile role updates and verify column privileges.
- [ ] Implement server-enforced draft/review/publish lifecycle and audit trail across content types.
- [x] Align robots rules with public pages and exclude search/private workspaces from crawling.
- [ ] Verify the production homepage is the intended AGRIVA platform page (the live root has previously differed from the repository homepage).
- [ ] Confirm that the product-detail route matches the sitemap's /marketplace/{product-slug} pattern.
- [ ] Verify all sitemap URLs return 200, have canonical tags, and contain meaningful content.
- [ ] Test mobile and desktop navigation, keyboard access, and low-bandwidth behavior.
- [ ] Check Search Console indexing, Core Web Vitals, real job/product data, and analytics after deployment.


## QA follow-up — safe article rendering

- Published article bodies now render a limited Markdown subset (headings, list lines, blockquotes, horizontal rules, paragraphs) as React text elements. Article body HTML is not injected, so raw HTML authored into a draft is displayed as text rather than executed.
- This is intentionally a conservative renderer without inline Markdown links/emphasis support. Before production release, validate rendering against real article fixtures and consider a maintained Markdown parser with raw HTML disabled and URL protocols restricted.
- CI/build status must be rechecked for commit `964ac45aedad19173784bab993c5217da01e88ba`; a previous successful build does not validate this new change.
- Remaining release blockers: multi-role membership migration and compatibility audit; content status transitions/revision attribution; public route and RLS runtime tests; duplicate slug checks; production homepage/campaign decision; Netlify preview failure investigation.


## Multi-role foundation (additive migration)

- Added `public.user_role_memberships` with unique per-user role memberships, a constrained role vocabulary (farmer, seller/reseller, buyer, job seeker/worker, employer, expert/educator, transport provider, organization, admin), RLS enabled, own-membership read access, and admin-only membership management.
- Migration `20261025180000_add_user_role_memberships.sql` is committed on the feature branch and was applied to the linked Supabase project as `add_user_role_memberships`. Verification confirmed RLS enabled and two policies present.
- The current database returned zero existing profiles/memberships during verification, so there were no existing profile roles to backfill in that project at that moment.
- This is a safe additive foundation, not a completed multi-role migration: legacy `profiles.role` remains for compatibility, signup/account settings and authorization checks have not yet been migrated to read/write memberships, and end-to-end role switching still requires implementation and tests.


## Pre-production issue fixed — content draft workflow

- The admin content-drafts client previously instantiated `@supabase/supabase-js` directly, creating a separate client that did not reliably share the authenticated SSR cookie session. It now uses `createBrowserClient` from `@supabase/ssr` so browser operations can use the existing auth session.
- Added database trigger `content_drafts_workflow_guard` via migration `20261025190000_enforce_content_draft_workflow.sql`. It rejects invalid status jumps, requires title/slug/body for approval and publication, prevents editing published content in-place, and updates `updated_at`.
- Added unique partial index `content_drafts_article_slug_unique` so article slugs cannot collide, including between drafts and published articles.
- Updated admin controls to match transitions: draft → review → approved → published; review can be rejected or returned to draft; approved can return to review; rejected can reopen as draft. Published content is locked from direct edits.
- Applied the migration to the linked Supabase project. Verified the unique index exists, the trigger is installed, and the trigger function is SECURITY INVOKER. A safe end-to-end transition test is still pending because the linked database currently has no content-opportunity rows to create a valid test draft.
- Current feature-branch build/checks must be green before merge. Production has not been deployed. Existing limitation: published content has no explicit unpublish/archive transition yet; that requires a deliberate status-model migration and UI workflow before editorial teams can unpublish articles.

- Reviewer attribution is now assigned by the database workflow trigger: approval/rejection stamps `reviewed_by = auth.uid()` and `reviewed_at`; returning an item to draft/review clears reviewer attribution; publishing updates the timestamp while retaining the approver identity. Verified the deployed trigger function is `SECURITY INVOKER` and contains this behavior.
