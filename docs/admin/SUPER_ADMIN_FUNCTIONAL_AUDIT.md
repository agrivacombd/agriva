# AGRIVA Super Admin — Functional Audit Matrix

**Audit date:** 2026-11-06  
**Scope:** Source-level review of the Admin routes and server/API actions on `feat/admin-control-center-architecture-v1`.  
**Important:** Statuses below describe what the code implements. They are not proof that production database migrations, RLS policies, external integrations, or live runtime flows are healthy. No production data or schema was changed for this audit.

## Status definitions

- **Working** — A page and its primary read/action path are implemented in source, with an authorization check. Runtime and deployment verification may still be pending.
- **Partial** — Some meaningful functionality exists, but a material part of the requested workflow is absent, limited, or not verified.
- **Prototype** — A demonstration or generation flow exists but does not provide a durable production workflow.
- **Missing** — No usable Admin page/action was found for the capability in this branch.
- **Blocked** — The capability is intentionally disabled or denied by a code guard / authorization boundary.

## Executive matrix

| Target workspace | Feature | Status | Source-level finding / gap |
|---|---|---|---|
| Command Center | Operational dashboard, core counts and pending-work links | Partial | Dashboard reads profile, product, order and opportunity data and exposes shortcuts. Some metrics depend on capability-gated queries; alert ownership, SLA queues and system-health signals are not comprehensive. |
| Marketplace | Product catalogue, filters and product editor | Working | Server-side product list/filter and product edit actions exist. |
| Marketplace | Categories and taxonomy | Working | Category create/edit/status workflow exists; migration/RLS availability still needs environment verification. |
| Marketplace | Seller onboarding and identity | Partial | Seller Applications is an alias/redirect to the shared Identity Verification queue; there is no separate seller onboarding workspace. |
| Marketplace | Product SEO fields | Partial | Product editor includes SEO-related fields, but URL slug/301 redirect management is explicitly not enabled when redirect-history support is unavailable. Marketplace overview also describes URL safety as not enabled. |
| Marketplace | Bulk inventory / bulk catalogue operations | Missing | No bulk-edit workflow found in the audited Admin routes. |
| Plant Market | Plant catalogue, care fields, stock and listing editor | Working | Separate `plant_market_products` catalogue, server-side filters and editor component exist. |
| Plant Market | Plant product moderation | Working | Separate moderation queue and guarded management API exist; verified gardener/module-grant checks and audit writes are present in the API path. |
| Plant Market | Plant care knowledge base / advisory authoring | Missing | Care attributes exist on product records, but no standalone knowledge-base/advisory management workflow was found. |
| Orders & Finance | Order listing and order-status transition | Working | Order list and `set_marketplace_order_status` server action exist with `orders.transition` authorization. RPC availability and runtime behavior still need verification. |
| Orders & Finance | COD collection / reconciliation | Blocked | `FINANCE_MUTATIONS_ENABLED = false`; COD collection action redirects with a finance-disabled notice. |
| Orders & Finance | Commission approval / payout execution / refunds | Blocked | Finance mutation switch is off; high-risk payment, payout, refund and recovery capabilities are excluded from the legacy allowlist and deny by default. |
| Orders & Finance | Finance reporting and CSV export | Partial | Reports read up to 5,000 orders/products/commissions/payouts and export summaries. It is not a reconciliation or money-movement workflow. |
| People & Trust | Customer/seller directory and role changes | Partial | Search/filter and farmer/reseller role update exist. Admin promotion is protected; customer support, account suspension UX and trust-case handling are incomplete. |
| People & Trust | Identity verification | Working | Pending/under-review applications, private evidence signed URLs, approval/rejection and review notes exist behind `identity.review`. Runtime/storage policy verification remains. |
| People & Trust | Support inbox / seller reports / trust cases | Missing | No dedicated Admin support or trust-case workflow found. |
| People & Trust | Delegated role and permission management UI | Missing | Capability registry and delegated permission checks exist, but no complete Admin UI to create/review role grants was found. |
| Agriculture & Services | Job moderation | Working | Status filters and a guarded moderation server action/RPC exist. |
| Agriculture & Services | Harvest listings | Partial | Admin page is read-only. Listings are public on submission and the page explicitly has no moderation action. |
| Agriculture & Services | Transport partner verification | Working | Partner filters and verified/rejected/suspended action exist behind `transport.moderate`. |
| Agriculture & Services | Green Exchange moderation | Partial | Approve/reject/return-to-pending action exists and revalidates public board and sitemap paths. Its page/action still uses a direct legacy `profiles.role === admin` guard rather than the shared capability helper. |
| Agriculture & Services | Farms, crops, crop advisory and market prices | Missing | No corresponding Admin management pages/workflows found in the audited route tree. |
| Growth, SEO & Analytics | Search-demand intelligence | Working | Persisted opportunity records, status filters and review updates exist; approval does not itself publish content. |
| Growth, SEO & Analytics | SEO content drafts | Partial | Persistent draft generation/list/revision workflow exists. Final publishing is a separate reviewed workflow and not completed from this module. |
| Growth, SEO & Analytics | Articles review | Partial | Separate `article_drafts` queue and review detail exist. Review page explicitly does not publish; publication path needs a separate authorization/audit review. |
| Growth, SEO & Analytics | Content Studio brief generation | Prototype | Brief-generation UI/API exists, but generated brief is held in client state and is not a persistent CMS publishing workflow. |
| Growth, SEO & Analytics | AI Content Intelligence prototype | Prototype | Page explicitly states draft/status changes are not persisted to CMS/database. Kept out of primary navigation. |
| Growth, SEO & Analytics | Technical SEO audit, canonical/indexing controls and redirects manager | Missing | No consolidated Admin workspace for technical SEO, indexing directives or redirect management found. Product slug redirect support is explicitly guarded/disabled when unavailable. |
| Growth, SEO & Analytics | Reports and analytics | Partial | Basic bounded reporting and CSV export exist; the page uses a direct legacy admin-role check, and no complete traffic/search analytics integration or configurable reporting pipeline was found. |
| System & Security | Audit log viewer | Partial | Reads the latest 100 audit events. It still uses a direct legacy `profiles.role === admin` guard; coverage is limited (for example product updates and user-role changes), and not all sensitive actions are proven to be audited. |
| System & Security | Site settings | Partial | Site identity, support details, homepage content and checkout flags can be updated via an RPC. This is not a full system/integration settings console. |
| System & Security | Capability authorization | Partial | Shared capability registry, legacy-admin allowlist, delegated permission RPC checks and deny-by-default high-risk capabilities exist. Full role-grant administration UI and end-to-end permission matrix tests are absent. |
| System & Security | System health, backups and integrations monitoring | Missing | No complete Admin health dashboard, backup verification/restore workflow or integration monitoring console found. |

## Route consolidation note\n\nThe legacy `/admin/opportunities` URL now redirects to the canonical `/admin/search-intelligence` workspace so the same persisted opportunity dataset is not maintained through two competing Admin screens.\n\n## High-priority blockers and safeguards

1. **Finance:** Keep COD reconciliation, commissions, payouts and refunds blocked until a reviewed service-role/RPC workflow, idempotency, reconciliation controls and audit coverage are verified. Do not switch `FINANCE_MUTATIONS_ENABLED` on as a UI-only change.
2. **Audit coverage:** Extend and test audit events for every sensitive mutation before enabling finance, role-grant or recovery workflows.
3. **Harvest:** Decide whether the product requirement remains intentionally read-only or whether moderation/report/takedown controls are required. Do not silently imply that the current page moderates listings.
4. **SEO:** Product SEO fields are not equivalent to a full technical SEO control plane. Canonical/indexing, sitemap diagnostics, redirect management and bulk metadata remain separate gaps.
5. **Authorization:** `requireAdminPage` / `requireAdminApi` and delegated grants must be tested against real roles and RLS policies. Green Exchange, Audit and Reports still contain direct legacy admin-role checks; migrate them deliberately to the shared capability model after compatibility testing. The existence of a capability string is not proof of an active grant.
6. **Publishing:** Search Intelligence approval, content-draft generation, article review and public publication are distinct steps. Keep them distinct until a single audited publishing flow is designed.

## UI/UX Phase 1 implementation coverage

The shared workspace shell and navigation are in place. Page-level visual alignment has been applied to the current Admin route set, including Command Center, Marketplace, Plant Market and moderation, Orders, People & Trust, Agriculture & Services, Growth/content/reports, Audit and Settings. The updates are presentation-only where practical; they do not claim to complete missing workflows.

**Remaining QA:** verify every page in an actual latest-commit Preview, test desktop/mobile breakpoints, keyboard/focus behavior, loading/error/empty states, long tables and forms, and check that every visible action has a working permission-guarded destination. Latest-commit Preview/build verification is still pending.

## Recommended next sequence

1. Close the Phase 1 visual QA checklist against a fresh Preview of the current branch head.
2. Convert each Partial / Prototype / Missing / Blocked row into an issue with owner, dependency and acceptance criteria.
3. Prioritize authorization and audit coverage before any high-risk finance or role-management work.
4. Build Growth & SEO only after separating persistent content drafts, editorial review and publication responsibilities.
5. Reconcile the feature branch with current `main` and complete regression checks before release approval.
