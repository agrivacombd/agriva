# AGRIVA Platform Architecture: Roles, Access, and Connected Workflows

Status: target architecture for incremental implementation. This document does not claim that every control described here is already implemented.

## 1. Architectural principles

1. One platform, one identity: public website, customer dashboard, seller workspace, staff workspaces, and Super Admin use the same authenticated identity and canonical data.
2. Deny by default: a role receives only the permissions explicitly granted to it. Hiding navigation is not authorization.
3. Enforce access on the server and database: route handlers, server actions, RPCs, row-level security (RLS), and Storage policies must all enforce the relevant boundary.
4. Separate platform governance from marketplace operations: Super Admin controls roles, policy, sensitive settings, and emergency actions; operational staff receive scoped permissions.
5. Review before publishing: seller products and editorial content enter review/pending states before becoming public unless a deliberately configured, audited trust policy permits otherwise.
6. Audit consequential actions: role changes, approvals/rejections, price/commission changes, refunds, payouts, settings, and publication changes must be attributable and reviewable.
7. Preserve existing customer journeys and schema compatibility; migrations must be additive where practical and verified against staging before production.

## 2. Role model

Use capability-based permissions rather than scattered role-name checks. Roles are named bundles of permissions; permissions are the enforcement unit. Keep the existing `profiles.role` compatibility during migration, then move privileged authorization to a controlled server/database role-assignment model. Never authorize from user-editable user metadata.

| Role | Main scope | Allowed examples | Explicitly not allowed by default |
| --- | --- | --- | --- |
| Super Admin | Whole platform | Manage staff roles, global policy, feature flags, integrations, security/audit views, emergency lockout | Unlogged sensitive changes; routine self-approval of own financial actions |
| Platform Admin / Operations | Operational platform scope | Orders, catalog operations, users support, operational queues | Grant Super Admin, reveal secrets, approve own payout/refund |
| Product Moderator | Catalog moderation | Review seller submissions, reject with reason, pause unsafe listings | Change commission rules, payouts, staff access |
| Content / SEO Manager | Editorial and search content | Draft/review SEO pages, metadata, sitemap/indexing workflows | User/financial data, secrets, staff access |
| Marketing Manager | Campaign and attribution | Campaigns, promotion content, aggregated analytics | Raw payment data, payout approvals, unrestricted user exports |
| Finance Manager | Finance scope | Reconcile orders/commissions, review payouts/refunds | Change role grants or approve own submitted payout |
| Support Agent | Customer support | View minimum necessary order/profile details, manage support cases | Read full secrets, change payout/commission, export all users |
| Seller | Own seller account and listings | Own profile, products, images, stock, prices, seller orders, fulfillment, own earnings | Other sellers' records, global catalog settings, commission policy, payout approval, staff/SEO settings |
| Customer / Buyer | Own account | Profile, addresses, carts, own orders, returns/support, saved items | Other customers' records or internal moderation data |
| Farmer / Grower | Own farm and listings | Farm profile, harvest listings, own inventory and buyer requests | Another farm's private records |
| Reseller / Affiliate | Own attribution and eligible commissions | Referral links, eligible orders, own balances | Other resellers' data, commission policy, payout approval |
| Transport Provider | Own provider workspace | Own vehicle/service profile, assigned bookings, fulfillment updates | Unassigned bookings' private data |
| Employer | Own organization and job posts | Create/edit own job posts, view authorized applications | Other employers' applicants |
| Job Seeker / Worker | Own profile and applications | Search jobs, manage own CV/applications | Other applicants' personal data |
| Student / Educator / Expert | Approved learning/community capabilities | Learning resources, permitted expert contributions | Admin tools unless separately granted |

Roles may overlap when a person genuinely performs multiple functions. Store role assignments as controlled records and evaluate permissions as the union of explicitly assigned, non-conflicting grants. High-risk permissions should require stronger authentication and, where appropriate, a second approver.

## 3. Permission namespaces

Use stable permission identifiers, for example:

- `dashboard.read_own`
- `profile.read_own`, `profile.update_own`
- `catalog.read_public`, `catalog.create_own`, `catalog.update_own`, `catalog.submit_for_review`
- `catalog.moderate`, `catalog.publish`, `catalog.pause`
- `orders.read_own`, `orders.fulfill_own`, `orders.support_read`
- `users.support_read_minimal`, `users.manage`
- `content.draft`, `content.review`, `content.publish`
- `finance.read_scoped`, `payout.request_own`, `payout.review`, `payout.approve`
- `settings.integrations.manage`, `settings.secrets.rotate`
- `roles.assign_scoped`, `roles.assign_super_admin`, `audit.read`

Avoid wildcard grants such as `*` for ordinary staff roles. Sensitive capabilities such as payout approval, role assignment, secret rotation, user export, and public publishing must be separately granted.

## 4. Application boundaries

- **Public Home / discovery:** public, indexable product and content pages only; no private account data. Public product queries must expose only products whose canonical state is publicly publishable.
- **Customer dashboard:** account-scoped. All orders, addresses, saved products, applications, and requests must be filtered by the authenticated subject on the server/database.
- **Seller dashboard:** seller workspace with onboarding/KYC state, listing status, inventory, orders, fulfillment, commissions, and payout requests. Every row and file must be constrained to the authenticated seller ID.
- **Staff workspace:** modules and actions appear according to permission grants. Each server action/API independently re-checks authorization.
- **Super Admin:** governance and cross-platform oversight, with least-privilege staff provisioning, audit trails, sensitive action confirmation, and separation of duties.
- **Database / Storage:** RLS and Storage policies are defense in depth. Security-definer RPCs require explicit auth/permission checks, a fixed search_path, narrow grants, input validation, and tests.

## 5. Core data and workflow relationships

Canonical relationships should be explicit and stable:

- `auth.users -> profiles -> role assignments -> permission grants`
- `seller account -> seller-owned products -> product media -> moderation decisions`
- `customer -> cart/order -> order items -> payment events -> commission ledger -> payout request/review`
- `content opportunity -> content draft/revisions -> approval -> published route -> sitemap/metadata`
- `staff action -> audit event`

Prefer immutable financial ledger entries over editing historical amounts. Order, payment, commission, refund, and payout transitions must be server/database-controlled and idempotent. Do not trust client-supplied owner IDs, status transitions, commission values, or payment outcomes.

## 6. Seller listing lifecycle

1. Seller onboarding: account verification and required business/product documents; record review state.
2. Seller creates or edits a listing; it is saved as draft/pending review.
3. Server validates required fields, category/subcategory, price, stock, media ownership, and seller permissions.
4. Moderator approves, rejects with a reason, or requests changes. Approval and audit entry are atomic.
5. Only approved and active listings are publicly discoverable/indexable. Unapproved drafts never enter public product queries or sitemap.
6. Seller changes to sensitive fields may trigger re-review. Stock and fulfillment updates can use narrower permissions.
7. Trusted-seller auto-publish is a future, explicit policy with limits, monitoring, and revocation—not a default.

## 7. Cross-cutting UX requirements

Every dashboard needs a consistent shell: role-specific navigation, current account/organization context, accessible mobile layout, task-oriented overview, searchable/filterable queues where relevant, clear empty/loading/error states, notification/action history, and safe confirmation for irreversible actions. Do not show dead links or pretend an action succeeded when persistence failed. Reuse shared design primitives and workflow components without forcing every role into the same dashboard.

## 8. Delivery sequence and release gates

### Phase A — Inventory and baseline
- Map every route, server action, API handler, database function, RLS policy, and Storage policy to an owner and required permission.
- Reconcile the role list shown by signup/dashboard with the canonical role model.
- Identify direct table writes and legacy admin-only assumptions.

### Phase B — Authorization foundation
- Introduce typed permission identifiers, role-to-permission mapping, server-side `requirePermission` helpers, and a controlled migration path from existing `profiles.role`.
- Add tests for direct URL/API access, cross-account object IDs, unauthenticated calls, role escalation, and fail-closed database errors.
- Preserve existing working journeys while moving checks to shared policy helpers.

### Phase C — Seller and customer workflows
- Implement seller account isolation, draft/review lifecycle, media ownership, seller order fulfillment, and own-account customer data boundaries.
- Keep financial policy and payout approval separate from seller operations.

### Phase D — Staff workspaces and Super Admin governance
- Build capability-driven navigation and queues for moderators, content, marketing, finance, and support.
- Add audited role grants, high-risk action controls, and separation of duties.

### Phase E — SEO, analytics, integrations, operations
- Connect public published states to canonical URLs, metadata, structured data, sitemap, and indexing rules.
- Protect provider secrets server-side; add consent-aware analytics, error monitoring, and integration health indicators.

### Phase F — Release readiness
- Run lint, type-check, regression tests, build, migration checks, RLS/security advisor checks, and staging end-to-end journeys.
- Verify role-by-role access matrix and seller/customer isolation using real test accounts.
- Validate backup/rollback and deployment target/commit before production release.

## 9. Non-negotiable release gates

- No seller can read or mutate another seller's private rows or media.
- No customer can read or mutate another customer's orders/profile.
- No ordinary staff member can grant themselves a stronger role.
- No pending/rejected listing or unpublished content is publicly discoverable or in the sitemap.
- Financial transitions are atomic, validated, idempotent, and auditable.
- Server/database authorization does not rely on UI visibility or user-editable metadata.
- CI is green; migrations are tested on staging; preview is verified at the exact commit being released.
