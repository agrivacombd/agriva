# AGRIVA Admin — Phase 0 Architecture & Security Audit

**Audit snapshot:** 2026-11-28  
**Repository:** `agrivacombd/agriva`  
**Branch:** `feat/admin-dashboard-premium-redesign`  
**Audited commit:** `baf6fa7bf2cf773a715dc264aa22a056d36482dc`  
**Related PR:** [#410](https://github.com/agrivacombd/agriva/pull/410)  
**Scope:** Admin workspace only. This is a source/schema-metadata audit; no production application records were queried or changed.

## 1. Executive outcome

The route inventory contains **36 Admin route entries: 32 page entries and 4 route handlers** (three Content Draft workflow handlers and one CSV export handler). In addition, **20 `/api/admin/*` route handlers** were inventoried and source-reviewed, alongside the Admin shell, Admin UI primitives, Admin-specific components, Admin service modules, relevant SQL migrations/functions, and read-only Supabase schema/advisor metadata.

The current Admin is a collection of working domain modules with a shared authenticated shell, not yet a fully unified enterprise workspace. The safest direction is an incremental architecture migration: preserve every route and business workflow, establish a single permission contract, standardize shared UI patterns, then migrate modules in bounded groups.

### Current CI/deployment signal

- GitHub Actions `quality`: **success** on the audited commit.
- Local Supabase Auth + PostgREST integration: **success** on the audited commit.
- Vercel status: **failure due to deployment rate limit** (“retry in 24 hours”), not a source build result.
- PR #410 remains open. No merge or deployment was performed.

### Phase 0 safety boundary

- No production application rows were selected or modified.
- No production schema, policies, functions, storage buckets, secrets, or configuration were changed.
- Supabase inspection was limited to table/column/FK metadata, migration history, advisor output, and read-only function definitions.
- No production deployment, merge, or live authenticated workflow test was performed.

## 2. Exact route-to-module mapping

Legend: **Legacy** = `requireAdminPage/requireAdminApi` backed by `profiles.role = 'admin'`; **Delegated** = `checkAdminPermission/has_admin_permission`; **Profile-only** = route performs its own authenticated profile-role check; **Layout + route** = global Admin layout gate plus the route-specific check.

| # | Route | Module / purpose | Observed access contract | Main data / dependency |
|---:|---|---|---|---|
| 1 | `/admin` | Executive dashboard, quick actions, order/commission/payout actions | Layout + Legacy `dashboard.read`; finance actions separately Delegated (`commissions.approve`, `payouts.approve`, `payouts.complete`) | profiles, products, marketplace_orders, reseller_commissions, commission_payouts, content_opportunities, finance RPCs |
| 2 | `/admin/command-center` | Operational overview and module directory | Legacy `dashboard.read` | profiles, products, marketplace_orders, module_access_applications |
| 3 | `/admin/access-control` | Roles, capabilities and user-role assignments; currently read-only | Delegated `roles.grant` gate + Legacy `dashboard.read` | admin_roles, admin_role_permissions, admin_user_roles, profiles |
| 4 | `/admin/audit` | Admin activity log | Legacy `audit.read` | admin_audit_log |
| 5 | `/admin/users` | User directory and Farmer/Reseller role change | Legacy `users.read`; database RPC independently checks admin role and blocks self/admin promotion | profiles, `admin_set_user_role`, admin_audit_log |
| 6 | `/admin/identity-verification` | Identity evidence and module-access application review | Legacy `identity.review` | module_access_applications, profiles, module_access_application_events, private identity-verification Storage objects |
| 7 | `/admin/seller-applications` | Marketplace seller application review | Same shared ApplicationManagement component and `identity.review` capability | Same application tables; filtered to Marketplace |
| 8 | `/admin/products` | Marketplace catalogue, edit, trash/restore/permanent delete | Legacy `catalog.read`, `catalog.edit`, `catalog.delete`; RPC boundary also required | products, categories/taxonomy, product images Storage, admin product RPCs |
| 9 | `/admin/categories` | Product taxonomy management | Legacy `catalog.read` / `catalog.edit` | product_categories, `admin_save_product_category` |
| 10 | `/admin/plant-market-products` | Plant Market moderation and product edit | Page `catalog.read`; API `catalog.read/edit/moderate` | plant_market_products, user_module_grants, gardener_profiles |
| 11 | `/admin/green-exchange` | Green Exchange listing moderation | Legacy `catalog.moderate`; database RPC checks admin role | green_exchange_listings, moderation RPC |
| 12 | `/admin/harvest` | Harvest listing moderation | Legacy `harvest.read` / `harvest.moderate`; DB function checks admin | harvest_listings, private moderation RPC, admin_audit_log |
| 13 | `/admin/seed-information` | Seed content, crop guides and product seed facts | Legacy `catalog.read` / `catalog.edit` | seed_category_content_sections, seed_crop_guides, products, product_seed_details |
| 14 | `/admin/orders` | Marketplace orders and COD collection | Legacy `orders.read` / `orders.transition`; COD currently shares the order-transition capability | marketplace_orders, marketplace_checkouts, cod_collection_events, order RPCs |
| 15 | `/admin/custom-orders` | Bulk RFQ, wholesaler verification, invitations, quotes and fulfillment | Legacy `orders.read`, `orders.transition`, and `identity.review` for named wholesaler verification | bulk_requests, bulk_request_items, bulk_quotes, bulk_wholesalers, bulk_invitations, bulk_selections, bulk_item_offers/awards, profiles |
| 16 | `/admin/finance` | Commission/payout read-only overview | Delegated `payments.read`; payout/commission mutations are intentionally not exposed here | reseller_commissions, commission_payouts |
| 17 | `/admin/reports` | Finance and marketplace report overview | Legacy `reports.export` | marketplace_orders, products, reseller_commissions, commission_payouts |
| 18 | `/admin/reports/orders.csv` | CSV export endpoint | API-level Legacy `reports.export` | marketplace_orders (selected non-contact fields; capped at 5,000) |
| 19 | `/admin/transport` | Transport partner verification | Legacy `transport.read` / `transport.moderate` | transport_partners, verification RPC |
| 20 | `/admin/jobs` | Job post moderation | Legacy `jobs.read` / `jobs.moderate`; DB function checks admin role and writes moderation event | job_posts, job_moderation_events |
| 21 | `/admin/demand-intelligence` | Demand/RFQ intelligence | Legacy `dashboard.read` | bulk_requests, bulk_quotes, bulk_wholesalers, bulk selections/items |
| 22 | `/admin/growth-intelligence` | Growth, acquisition and marketplace KPIs | Legacy `dashboard.read` | profiles, marketplace_orders, order_events, attribution_sessions |
| 23 | `/admin/opportunities` | Editorial/content opportunities | Legacy `content.read` | content_opportunities |
| 24 | `/admin/search-intelligence` | Search intelligence landing/redirect | Route wrapper; verify target route remains the canonical destination | Search-intelligence opportunity workflow |
| 25 | `/admin/search-intelligence/opportunities` | Search-derived content opportunities | Page uses client API; API GET `content.read`, PATCH `content.publish` | content_opportunities; `/api/admin/content-opportunities` |
| 26 | `/admin/articles` | Article drafts and review queue | Legacy `content.read` | content_drafts |
| 27 | `/admin/articles/[id]` | Legacy article detail compatibility route | Legacy `content.read`; redirects to content-drafts editor or articles list | content_drafts |
| 28 | `/admin/content-drafts` | Editorial draft management | Page has direct profile-role check; mutation endpoints separately enforce `content.edit` / `content.publish` | content_drafts, content_draft_revisions, content_opportunities, article image Storage |
| 29 | `/admin/content-drafts/publish` | Content publication endpoint | API-level Legacy `content.publish` | content_drafts; conditional approved→published update |
| 30 | `/admin/content-drafts/trash` | Content trash, restore and permanent delete | API-level `content.edit`; `content.publish` additionally required for permanent deletion and published-content trash | content_drafts, content_draft_revisions, audit trigger |
| 31 | `/admin/content-drafts/workflow` | Editorial save/review/approve/reject/publish state machine | API-level `content.edit`; publication-impacting transitions additionally require `content.publish` | content_drafts, editorial quality checks |
| 32 | `/admin/content-studio` | Editorial command hub and AI-assisted content tools | Profile-only admin check; child APIs separately enforce content capabilities | article_drafts, content_drafts, content-opportunity APIs, external AI/search providers |
| 33 | `/admin/ai-content` | AI content prototype | Profile-only admin check; described in Content Studio as non-persistent prototype | local client state; no persistent draft store in this page |
| 34 | `/admin/seo` | SEO overview | Legacy `content.read` | content_drafts, content_opportunities, seo_landing_pages |
| 35 | `/admin/seo-pages` | SEO landing-page management | Legacy `content.read`; APIs separately enforce `content.read/edit/publish` | seo_landing_pages |
| 36 | `/admin/settings` | Site settings and integration configuration | Legacy `settings.read/write`; database RPC has an independent admin check | site_settings, site_integrations, site_integration_audit |

### Navigation gaps

- `/admin/custom-orders` exists but is not a first-class item in the current AdminShell navigation.
- The shell includes `/super-admin` (“Module directory”), which is outside the 36 Admin route entries and needs a separate route/access-contract check.
- Navigation is not permission-filtered. Server-side checks remain the security boundary, but the shell can expose links that a given delegated administrator cannot open.
- The search-intelligence opportunity sub-route is reachable through its parent workspace but is not a direct sidebar item.

## 3. Admin API inventory (20 handlers)

All 20 `/api/admin/*` handlers were inventoried. The following permission contracts were observed in source:

| API | Method(s) | Capability / purpose |
|---|---|---|
| `/api/admin/ai-article` | POST | `content.edit`; generate article text, does not publish |
| `/api/admin/ai-article/draft` | GET, POST | `content.edit`; read/create draft |
| `/api/admin/ai-article/image` | POST | `content.edit`; generate image via external AI provider |
| `/api/admin/ai-article/image/save` | POST | `content.edit`; upload WebP assets and conditionally update draft |
| `/api/admin/article/generate` | POST | `content.edit`; create article draft |
| `/api/admin/content-brief` | POST | `content.edit`; template-based content brief |
| `/api/admin/content-drafts/generate` | POST | `content.edit`; source-aware AI draft creation |
| `/api/admin/content-drafts/upload-image` | POST | `content.edit`; article image upload and revision-safe update |
| `/api/admin/content-opportunities` | GET, PATCH | `content.read` / `content.publish`; opportunity state changes |
| `/api/admin/google-trends` | GET | `content.read`; external search trend providers |
| `/api/admin/plant-market-products` | GET, PATCH | `catalog.read/edit/moderate`; listing/product moderation |
| `/api/admin/products` | POST | `catalog.create`; create product through database RPC |
| `/api/admin/products/ai-seo` | POST | `catalog.edit`; AI SEO suggestions |
| `/api/admin/products/images` | PATCH | `catalog.edit`; image gallery update RPC |
| `/api/admin/products/seo` | PATCH | `catalog.edit`; SEO update RPC |
| `/api/admin/recent-orders` | GET | `orders.read`; private/no-store recent order feed |
| `/api/admin/seller-permissions/[market]` | GET | `catalog.moderate`; read active seller grants |
| `/api/admin/seller-permissions/[market]/[userId]` | PATCH | `catalog.moderate`; revoke scoped market grant |
| `/api/admin/seo-pages` | GET, POST | `content.read/edit`; landing-page list/create/edit |
| `/api/admin/seo-pages/workflow` | PATCH | `content.edit`, plus `content.publish` for approval/publication transitions |

**Important:** the 20 API routes above are distinct from the four route handlers under `app/admin`. API-level checks were observed in the reviewed handlers. A final authorization test suite must still exercise each endpoint as anonymous, ordinary authenticated user, legacy admin, delegated admin with/without the exact capability, and after capability expiry/revocation.

## 4. Permission architecture and matrix

### Existing authorization paths

1. **Legacy gate — `lib/admin/authz.ts`**
   - Authenticates using `supabase.auth.getUser()`.
   - Reads `profiles.role` and requires `role = 'admin'`.
   - A static allow-list currently enables dashboard, catalogue, harvest, jobs, orders, users, identity, roles, content, settings, audit, reports, transport and health capabilities for every legacy admin.
   - Finance money-movement and system recovery capabilities are intentionally absent from this legacy allow-list.
2. **Delegated gate — `lib/admin/permission-service.ts`**
   - Authenticates the user and calls `has_admin_permission`.
   - Checks a global, unexpired assignment in `admin_user_roles` joined to `admin_role_permissions`.
   - Used by Finance and Access Control UI gates, and by dashboard finance actions.
3. **Database enforcement**
   - Sensitive SECURITY DEFINER functions often repeat `auth.uid()` and an admin/capability check inside the database.
   - Finance functions are in `private` and check their exact delegated capability; payout approval and payout completion are separate.
   - Application review, user-role change, harvest/job/Green Exchange moderation and site-setting functions check admin identity inside the database.

### Permission matrix (observed and target correction)

| Capability area | Current observed capability | Current DB boundary | Phase 1 target |
|---|---|---|---|
| Dashboard / command center | `dashboard.read` | Admin layout + legacy role | Keep read-only, permission-aware navigation |
| Catalogue browse/create/edit/moderate/delete | `catalog.read/create/edit/moderate/delete` | API/server action + selected RPC checks | Keep distinct actions; add resource-scoped policies where needed |
| Harvest / jobs / transport | `harvest.*`, `jobs.*`, `transport.*` | DB moderation functions and event records | Keep distinct domain capabilities and audited reason |
| Orders | `orders.read/transition` | Order RPC checks admin or valid seller module scope and state transitions | Split refunds and COD reconciliation from fulfillment transition |
| COD collection | Currently `orders.transition` in server action | `record_cod_collection` RPC (function definition/grants need explicit final verification) | Require `payments.reconcile` in both server and DB |
| Identity / seller applications | `identity.review` | `admin_review_module_application` checks admin, locks pending row, grants requested module access | Keep approval/rejection distinct from roles and market access revoke |
| Seller market access revoke | `catalog.moderate` API gate | `admin_revoke_market_access` checks admin and exact module/scope | Introduce explicit `seller_access.revoke` capability; test scope isolation |
| Content read/edit/publish | `content.read/edit/publish` | API gates and compare-and-set workflow; publish requires approved state | Keep three capabilities; publish/delete require reason and immutable event |
| Finance | `payments.read`, `commissions.approve`, `payouts.approve`, `payouts.complete` | Private DB functions enforce exact capabilities; payout is separately approved then paid | Preserve separation; add immutable audit event for every financial transition |
| Roles / admin access | `roles.grant` UI gate; page is currently read-only | Admin role tables and DB policies | No grant/revoke UI until full grant lifecycle, expiry, scope, self-lockout and audit tests pass |
| Settings / integrations | `settings.read/write`; delegated `settings.manage` type exists but is not the page contract | Site-setting RPC checks admin; integration upsert relies on table policy and logs separately | Split site copy from provider configuration; secret redaction and audit must be transactional |
| Reports | `reports.export` | CSV endpoint independently checks capability | Add export event, date filters, row-count disclosure, async export for large datasets |
| System recovery | Type exists, not enabled through legacy allow-list | No active UI workflow observed | Deny by default; separate break-glass process |

### Authorization decisions

- Do **not** merge the two authorization services by replacing one with the other. First define a canonical capability registry, map every route/action/RPC to it, and test old and new grants in parallel.
- The UI should hide or disable unavailable actions based on server-provided effective permissions, but every Server Action/API/RPC must still independently authorize.
- Delegated roles must be deny-by-default, global vs scoped assignments must be explicit, expiry/revocation must be enforced server-side, and admin self-escalation/self-lockout must be prevented.
- Access Control must remain read-only until grant/revoke workflows, dual-control for Super Admin changes, recovery, and audit coverage are complete.

## 5. Component adoption matrix

| Component / area | Current adoption | Finding / target |
|---|---|---|
| `AdminShell` | Global Admin layout | Shared navigation/topbar/mobile drawer exists. Add permission-aware nav, missing custom-orders link, keyboard/focus management, collapsible groups, favorites and route registry. |
| `admin-design-system.css` | Global stylesheet in Admin layout | Token and workspace foundation is active across authenticated modules. Replace remaining hard-coded one-off styles gradually with semantic tokens. |
| `AdminPage` | Dashboard and shared ApplicationManagement | First adoption completed. Migrate every page shell in batches. |
| `AdminPageHeader` | Primitive available; adoption not yet broad | Standardize title, description, breadcrumbs and actions. |
| `AdminPanel` / `AdminSectionHeader` | Primitive available; adoption not yet broad | Standardize section surfaces and hierarchy. |
| `AdminMetricCard` | Primitive available; dashboard has bespoke metric cards | Replace duplicated KPI cards only after parity and responsive QA. |
| `AdminStatusBadge` | Primitive available; many modules have local status classes | Create canonical domain status map and adopt it. |
| `AdminEmptyState` | Primitive available; modules still use local empty text | Add consistent empty, filtered-empty and error states. |
| `AdminTableFrame` | Primitive available; many pages implement local table wrappers | Create AdminDataTable with filters, sorting, pagination, row actions, selection and mobile card fallback. |
| `OrderNotificationBell` | In AdminShell | Polls recent orders every 30s and stores read cursor in browser localStorage. It is not a push service; UI text correctly says so. Build notification abstraction later without claiming push delivery. |
| `ApplicationManagement` | Shared by Identity Verification and Seller Applications | Good domain reuse. Sensitive evidence uses owner-prefixed paths and 5-minute signed URLs; minimize applicant_data fields and add evidence access audit. |
| `SellerPermissionManager` | Embedded admin component | Uses `catalog.moderate` for read/revoke and calls a scope-aware RPC. Capability should be domain-specific and revocation must be audited. |
| `PlantMarketProductReview` | Dedicated client component | API-driven pagination and moderation. Keep workflow but standardize table/cards, filters and status components. |
| `AdminCreateProductForm`, product editors/images | Dedicated forms and API/Storage | Preserve product creation/editor workflows; align field validation, upload limits, progress, errors and image permissions. |
| `AdminSeedRichTextEditor`, `AdminProductDescriptionEditor` | Specialized editors | Keep domain-specific editing; centralize sanitization/preview and keyboard accessibility. |
| `LearningCorrectionInbox` | Client-side Supabase browser client | Reads/updates correction reports directly from the browser; confirm RLS policy and admin-only UPDATE under anonymous-sign-in configuration, or move mutations to a server action. |
| `ProductRemovalControls` | Dedicated high-risk control | Keep separate from ordinary edit; explicit typed confirmation, trash/restore/permanent delete and audit receipts. |
| `AIContentDashboard` | Prototype / local state | Keep labelled as prototype until persistence, audit, quota/rate-limit and editorial controls are implemented. |
| `AdminPrimitives` README | Documentation exists | Expand with canonical table/form/drawer/dialog/toast/timeline patterns and accessibility acceptance criteria. |

## 6. Supabase data and workflow dependency map

Admin data currently spans these existing domains; Phase 1 must reuse them before proposing new schema:

- **Identity and access:** `profiles`, `module_access_applications`, `module_access_application_events`, `user_module_grants`, `admin_roles`, `admin_role_permissions`, `admin_user_roles`.
- **Marketplace catalogue:** `products`, `product_categories`, subcategories/taxonomy, `plant_market_products`, `product_seed_details`, `seed_category_content_sections`, `seed_crop_guides`.
- **Marketplace operations:** `marketplace_orders`, `marketplace_checkouts`, `cod_collection_events`, `order_events`, `harvest_listings`, `green_exchange_listings`.
- **Bulk trade:** `bulk_requests`, `bulk_request_items`, `bulk_quotes`, `bulk_wholesalers`, `bulk_invitations`, `bulk_selections`, `bulk_item_offers`, `bulk_item_awards`.
- **People and work:** `transport_partners`, `transport_bookings`, `transport_quotes`, `job_posts`, `job_moderation_events`.
- **Finance:** `reseller_commissions`, `commission_payouts`, `commission_ledger`, `payment_transactions`.
- **Content and growth:** `content_opportunities`, `content_drafts`, `content_draft_revisions`, `article_drafts`, `seo_landing_pages`, `search_queries`, `search_opportunities`, `attribution_sessions`.
- **Governance and configuration:** `admin_audit_log`, `site_settings`, `site_integrations`, `site_integration_audit`.
- **Storage:** `identity-verification` private evidence, article hero/social images, product image buckets.

### Workflow invariants to preserve

1. Application approval must lock the pending application, verify organization ownership where applicable, create only the requested module grants and write review history.
2. Order transitions must remain forward-only, inventory release must only occur for eligible pre-dispatch cancellation/refund states, and commissions must reverse/approve consistently.
3. COD collection must remain append-only/audited, enforce expected/cumulative amount integrity and be separately authorized from order status changes.
4. Payout approval and payout completion must remain separate capabilities and separate database transitions; completion must verify approved commission balance and payment reference.
5. Content publication must require approved state, valid title/slug/body and no unsaved edits; trash/restore/permanent deletion must preserve deletion receipts/revision policy.
6. Product permanent deletion must remain separate from ordinary edit and require trash state plus typed confirmation.
7. Seller access revoke must target only the selected module and scope; no broad user-wide role mutation.
8. Integration configuration must not activate analytics/marketing scripts before consent and event QA; never store arbitrary executable scripts.

## 7. Risk register

Severity is a prioritization, not a claim that an exploit was reproduced. Findings below are source/advisor observations and require controlled verification before remediation.

| ID | Severity | Finding | Evidence / impact | Required response |
|---|---|---|---|---|
| R-01 | **P0** | Two authorization systems and inconsistent route gates | Legacy role allow-list, delegated role RPC and Profile-only route checks coexist. Effective capability semantics can diverge; navigation is not permission-filtered. | Canonical capability registry; complete route/action/RPC matrix; dual-run tests; no RBAC rewrite until parity. |
| R-02 | **P0** | SECURITY DEFINER RPC exposure needs exhaustive review | Supabase advisor reported 4 anon-callable and 38 authenticated-callable SECURITY DEFINER functions. This is not automatically a vulnerability: some are intentional and several inspected private functions enforce `auth.uid()`/admin/capability. However, every function's grants, search_path and internal authorization must be verified; `public.rls_auto_enable()` is a particular review target. | Inventory all 42 flagged functions, inspect body + EXECUTE grants, verify anon/authenticated negative tests, revoke or relocate only after dependency analysis. |
| R-03 | **P0** | RLS enabled/no policy tables require intended-access proof | Advisor listed 5 tables with RLS enabled but no policies: buyer_demand_rfq_conversions, crop_health_feed_slug_registry, marketplace_order_idempotency, product_rank_daily_metrics, product_rank_events. This can be correct for private server-only tables if client grants are absent. | Verify grants and Data API exposure; document each as server-only or add least-privilege policy. Do not add permissive policies just to silence advisor. |
| R-04 | **P0** | Anonymous-sign-in / authenticated-policy interaction | Advisor produced repeated warnings where policies target `authenticated` while anonymous sign-ins are enabled. Anonymous Supabase users can carry the authenticated Postgres role; the actual risk depends on each policy's `auth.uid()`/ownership predicates. | Verify Auth anonymous sign-in setting and test anonymous JWT against all flagged admin and user policies. Add explicit non-null identity/ownership predicates where required. |
| R-05 | **P1** | Learning Correction Inbox performs browser-side updates | Client component reads/updates `learning_correction_reports` using browser Supabase client; correctness depends entirely on RLS. | Inspect exact table policy/grants and test anonymous + normal user denial. Prefer a server action with explicit `content.edit`/dedicated capability and audit. |
| R-06 | **P1** | COD reconciliation shares `orders.transition` | `recordCodCollection` is guarded by `orders.transition`, not `payments.reconcile`. | Split capability at server action and DB function; add tampering, over-collection, duplicate and concurrent collection tests. |
| R-07 | **P1** | Seller permission revoke uses broad catalogue capability | Seller-permissions GET/PATCH use `catalog.moderate`, although this changes user module access. | Add `seller_access.read/revoke`; require scope, reason and audit event. |
| R-08 | **P1** | Financial audit completeness needs strengthening | Finance DB functions enforce delegated permissions and separate approval/payment, but inspected commission/payout functions do not append a central `admin_audit_log` event. Some records have actor/time fields, but a common immutable transition record is still needed. | Add transactional finance audit event with actor, action, entity, before/after status, payment reference fingerprint/redaction, timestamp and correlation ID. |
| R-09 | **P1** | Integration audit write is not transactionally coupled to configuration save | Settings Server Action upserts `site_integrations`, then inserts `site_integration_audit`; audit insert error is not checked and can leave a saved configuration without its expected audit row. | Move save + audit to one validated DB function/transaction or check and fail closed; redact all secret-like config values. |
| R-10 | **P1** | Admin audit coverage is fragmented | `admin_audit_log`, application events, job moderation events, COD events and integration audit are separate histories; some actions have no central audit event. | Define a common audit event contract and keep domain-specific ledgers where they are legally/operationally required. |
| R-11 | **P1** | Private identity data is loaded in a broad object | ApplicationManagement selects `applicant_data` and signs up to five evidence objects for five minutes. This is privileged, but broad JSON fields can expose more than the UI needs. | Project only approved fields, audit evidence opens/downloads, shorten URL lifetime if practical, add retention and redaction policy. |
| R-12 | **P1** | Navigation and route coverage mismatch | `/admin/custom-orders` absent from sidebar; all nav items display regardless of delegated capability; `/super-admin` link is outside this inventory. | Create typed route registry with module, exact capability and legacy alias; permission-filter links; separately audit /super-admin. |
| R-13 | **P1** | Inconsistent pagination and report limits | Some modules use fixed 100/300/500/5,000 row limits; Finance summarizes latest 100 and explicitly is not a ledger balance; reports cap at 5,000. | Standard server-side cursor/range pagination, filter count accuracy, export range and “partial dataset” labels. |
| R-14 | **P2** | Design system adoption is shallow | Shared CSS wrapper applies broadly, but direct primitive adoption is concentrated in dashboard and ApplicationManagement; many modules retain bespoke headers/tables/status styles. | Migrate by domain batches; avoid mass CSS rewrite. |
| R-15 | **P2** | Admin shell accessibility and productivity gaps | Mobile drawer has no explicit focus trap/Escape close in the inspected component; no command palette/favorites/recent pages; groups are static. | Add keyboard/focus management, accessible group toggles, command palette and saved navigation. |
| R-16 | **P2** | Advisor performance backlog | Read-only advisors reported 12 auth_rls_initplan, 14 unindexed foreign keys, 49 unused indexes and 4 multiple-permissive-policy findings. These are performance observations, not proof of current user-facing defects. | Prioritize Admin query paths; benchmark before adding/removing indexes or rewriting policies. |
| R-17 | **P2** | Browser notification is polling, not push | Bell polls every 30 seconds and uses localStorage; no service-worker push delivery is present in this workflow. | Label accurately; build true push only with subscription lifecycle, delivery retries, consent and observability. |

## 8. Design System adoption and module migration plan

### Target module architecture

- **Overview:** Executive Dashboard, Command Center, Work Queue, Alerts.
- **Marketplace:** Products, Categories, Orders, Harvest, Plant Market, Green Exchange, Seed Information.
- **People & Trust:** Users, Identity Verification, Seller Applications, Seller Permissions.
- **Business Operations:** Custom Orders, Demand Intelligence, Transport, Jobs.
- **Finance:** Finance Overview, Commission, Payouts, Reconciliation, Reports.
- **Growth & Intelligence:** Growth Intelligence, Opportunities, Search Intelligence, SEO, SEO Pages.
- **Content Studio:** Articles, AI Content, Content Drafts, Content Studio.
- **Governance:** Access Control, Audit Logs, Admin Activity, Security Events.
- **Platform Settings:** Settings, System Health, Integrations, Notification Configuration.

Existing URL paths remain canonical during migration. Navigation labels/groups may change, but routes must not be removed or silently hidden.

### Component layers

1. **Foundation:** semantic color/spacing/type/radius/shadow tokens, focus, motion, responsive breakpoints.
2. **Shell/navigation:** AdminAppShell, permission-aware navigation, breadcrumbs, command palette, notifications, favorites, recent pages, account/session controls.
3. **Data display:** AdminDataTable, filter bar, pagination, metric cards, status badges, timeline, detail drawer.
4. **Forms/actions:** validated fields, upload controls, destructive confirmation, permission gates, action menus.
5. **Feedback:** skeleton, empty state, error/retry, toast, inline validation, stale-data indicators.
6. **Workflow:** Work Queue, approval/review panels, audit timeline, entity detail workspace.

### Module adoption matrix (implementation order)

| Batch | Modules | Required reusable components | Gate |
|---|---|---|---|
| A | Shell + Dashboard + Command Center | AdminAppShell, PageHeader, MetricCard, Alert, CommandPalette, route registry | All 36 routes resolve; nav capability matrix; responsive shell |
| B | Users + Identity + Seller Applications + Access Control | DataTable, DetailDrawer, Timeline, EvidenceViewer, PermissionGate, ConfirmDialog | RLS and delegated-role negative tests; evidence access audit |
| C | Products + Categories + Plant Market + Green Exchange + Harvest + Seed Information | DataTable, FilterBar, ProductEditor, UploadField, ModerationPanel, StatusBadge | CRUD/moderation RPC contracts, storage RLS, delete/restore tests |
| D | Orders + Custom Orders + Transport + Jobs | WorkQueue, OrderTimeline, TransitionDialog, COD reconciliation form | Transition graph, concurrency/idempotency, payment reconciliation permissions |
| E | Finance + Reports | Financial summary, LedgerTable, ReconciliationPanel, ExportDialog | Delegated capability, double-approval boundary, immutable audit |
| F | Content + SEO + Growth + Search Intelligence | EditorialTable, DraftEditor, WorkflowStepper, SEO preview, KPI cards | No auto-publish, compare-and-set, content version and audit |
| G | Governance + Settings + System Health | AuditTable, RoleMatrix, IntegrationSecretField, HealthStatus | Fail-closed config save, secrets redaction, role expiry/revocation |

## 9. Technical architecture decisions

- Keep Next.js Server Components for protected reads; use Client Components only for interactive state.
- Every Server Action and API endpoint must call a server-only authorization helper; UI permission checks are convenience only.
- Every privileged RPC must check authenticated identity and the exact capability/role inside the database; use fixed `search_path`, explicit EXECUTE grants and transactional side effects.
- Keep existing RLS and RPC boundaries; do not replace them with service-role browser access.
- Use explicit column projections; never fetch `select('*')` for sensitive application, profile, finance or integration data.
- Introduce a typed Admin route registry containing route, module, label, icon, read capability, action capabilities, legacy path and feature status.
- Introduce a canonical capability registry; preserve legacy admin behavior during staged migration and test both permission paths.
- Use stable entity IDs and idempotency/concurrency guards for Work Queue actions. Work Queue should aggregate existing queues first, not create duplicate tasks.
- Audit events must include actor, action, entity, outcome, reason, timestamp and correlation ID; redact passwords, tokens, identity documents, private phone/address and payment secrets.
- Do not add a new table, background job, notification channel or migration until existing sources and constraints are proven insufficient.

## 10. Phase 1 implementation plan (development branch only)

### P0 — Security and contracts before visual expansion

1. Build machine-readable route/action/API/RPC capability inventory and canonical capability registry.
2. Review all advisor-flagged SECURITY DEFINER functions and execute grants; test anonymous/normal-user denial.
3. Verify RLS/no-policy tables are inaccessible to anon/authenticated unless intentionally exposed.
4. Verify anonymous sign-in configuration and every policy flagged as targeting authenticated.
5. Move Learning Correction Inbox mutations behind a server action or prove/test its RLS contract.
6. Split COD collection to `payments.reconcile`; add a dedicated seller-access revoke capability.
7. Make integration configuration save + audit atomic and add finance audit events.
8. Add negative tests for admin routes, APIs, RPCs and storage.

### P1 — Shared workspace and reusable UI

1. Finalize route registry and permission-aware sidebar; add missing Custom Orders navigation.
2. Add keyboard-accessible mobile drawer and command palette.
3. Standardize page header, section, metric, status, table, filter, pagination, empty/error/loading and confirm-dialog patterns.
4. Migrate modules in the A→G order above, one small PR per batch.
5. Preserve old URLs and workflows; add redirect tests only where a route alias is intentionally introduced.

### P2 — Value-add after existing workflows are stable

- Unified Work Queue from existing application, moderation, order, RFQ, content and payout queues.
- Cross-module search with permission-filtered results.
- Saved filters/views, favorites and recent pages.
- Entity timeline for seller, user, product, order, application and content.
- KPI trends with explicit date ranges and source definitions.
- Platform health and operational alerts based on real existing telemetry.
- AI summaries/recommendations in read-only mode first; no automatic approval, moderation, payout or publication.

## 11. Acceptance gates before merge/production

- [ ] All 36 Admin route entries have an owner module, access capability, dependency list and preserved URL.
- [ ] All 20 Admin APIs have anonymous/ordinary-user/authorized/unauthorized tests.
- [ ] All Server Actions have validation, server-side authorization and negative tests.
- [ ] All privileged RPCs have verified grants, search_path and internal authorization.
- [ ] RLS, Storage and anonymous-sign-in tests pass for sensitive tables/buckets.
- [ ] No sensitive identity, contact, integration or finance fields leak into unauthorized responses.
- [ ] Finance and COD transitions are idempotent, concurrency-safe and auditable.
- [ ] All destructive operations have explicit confirmation and recovery/retention policy.
- [ ] All tables have server-side pagination/filtering and truthful partial-result labels.
- [ ] Every route has loading, empty, error and retry states.
- [ ] Keyboard, screen-reader, focus, contrast and reduced-motion checks pass (WCAG 2.2 AA target).
- [ ] Browser QA at 390, 768, 1024 and 1440 px; no page-level horizontal overflow.
- [ ] CI green; Vercel Preview succeeds; authenticated workflow QA uses test accounts/data only.
- [ ] Production rollout has a reviewed rollback plan and explicit approval.

## 12. Audit limitations / follow-up verification

This is a broad static source and schema-metadata audit, not a completed penetration test or authenticated end-to-end browser audit. The following require a dedicated isolated test environment:

- Every RLS policy and Storage policy under anonymous sign-in, normal authenticated user, legacy admin and delegated admin.
- All 42 advisor-flagged SECURITY DEFINER functions and their EXECUTE grants (the key admin/finance/application/order functions sampled above are not a substitute for reviewing every flagged function).
- Exact `learning_correction_reports` policy and storage bucket policy behavior.
- Every RPC used by custom orders, COD collection, category management, transport, product trash and content revisions.
- Full workflow side effects and audit event completeness under concurrency, retries and partial failure.
- Browser QA of all 32 page routes with representative test roles; production authenticated mutations are explicitly out of scope.

**Phase 0 recommendation:** treat the risks R-01 through R-04 as implementation blockers. Complete the P0 security/permission contracts before building new Work Queue, notification, or automation features. No production schema/data/deployment action is part of this plan.
