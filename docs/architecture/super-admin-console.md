# AGRIVA Super Admin Console — Architecture & Audit Plan

**Status:** Architecture and phased implementation plan; production schema changes require explicit environment reconciliation  
**Scope:** Next.js App Router, Supabase Auth/Postgres/RLS, Vercel production  
**Last reviewed:** 2026-10-29

## Executive summary

AGRIVA already has a substantial admin surface under `app/admin` (dashboard, products, orders, users, jobs, harvest moderation, transport, categories, content, reports, settings and audit). The best path is **not** to create a second, parallel admin app. Evolve the existing console into a coherent, capability-based Super Admin workspace, fix the environment/schema drift first, and put every privileged operation behind a shared server-side authorization boundary plus database enforcement.

### Audit findings that influence the design

1. Vercel's 7-day runtime logs contain old production errors:
   - Jobs query: `PGRST205`, missing `public.job_posts` in the PostgREST schema cache (33 occurrences in the inspected window).
   - Plant Market and Smart Search: `products.moderation_status` missing (7 and 4 occurrences respectively).
   - Crop diagnosis history: `public.crop_disease_detections` missing (3 occurrences).
   - Supabase Auth cookie mutation errors on Server Component renders, plus an invalid refresh token.
   - Gemini provider 404 and admin product creation `PGRST202` errors.
   Counts are occurrences in the log window, not proof that each issue is still active.

2. The Supabase project currently accessible to the audit is `utytcoxpjnoanqffkqft` (`utytcoxpjnoanqffkqft.supabase.co`). Its live schema inspection shows `products.moderation_status`, `job_posts`, and `crop_disease_detections` exist, and the migration ledger includes the jobs/crop and moderation work. However, the historical Vercel log identifies a different Supabase host (`dhqaepsbuwhbynagfxpf5.supabase.co`). This is a **high-priority environment identity mismatch to investigate**: production may have used another Supabase project at the time of those errors, or the logs may belong to an older deployment/configuration. Do not apply migrations to either project until Vercel's active production URL and the intended project are explicitly reconciled.

3. The current shared admin layout checks `profiles.role === 'admin'`. The admin product API repeats a similar check. Meanwhile, the database has `user_role_memberships`, capability/role helper functions, and scoped moderator workflows. A future console must not accidentally grant staff the full admin surface or block legitimate scoped staff. Use a central capability model, while preserving existing database checks until migration parity and regression tests are proven.

4. The latest listed production deployment is the Bengali SEO landing-page commit. A docs-only architecture PR should not require or trigger a database migration. Recheck the active deployment and runtime logs after fixes.

## Implementation tracking

### Phase 0 — Current operational status

- The latest selected 1-hour Vercel runtime-error window is clear. The 24-hour error groups inspected point to earlier deployments; Smart Search, admin product RPC, and Gemini errors are not currently confirmed as active.
- The historical runtime logs reference a different Supabase host from the separately inspected Supabase project. Environment secret values were not decrypted, and no production migration was applied. Treat the host identity as **unverified**, not resolved, until the active Production URL is compared with the intended project in Vercel settings.
- Existing `job_posts` and `crop_disease_detections` tables are present in the project inspected from the historical host. The product moderation columns differ between the two accessible projects, so keep application compatibility with the released schema and do not add moderation-only columns without a reviewed migration.

### Phase 1 — Authorization foundation in progress

- A shared server-only capability guard is being introduced in `lib/admin/authz.ts` and used by the `/admin` layout, `/super-admin` hub, and admin product-creation API.
- This first increment preserves the existing `profiles.role = 'admin'` boundary. It is **not yet full granular staff RBAC**: unconverted routes retain their own checks, and capability grants for scoped staff must not be enabled until database enforcement and capability-matrix tests are in place.
- High-risk capabilities for payment reconciliation, refund requests, payout approval, and system recovery remain denied by default until reviewed grant and step-up flows exist.
- No database schema, payment configuration, or user data was changed by this implementation increment.

## Product goals

- One operational home for marketplace, harvest, buyers/demands, orders, payouts/commissions, users/roles, jobs, transport, crop support, content/SEO, and platform health.
- Make important work queue-driven: pending product moderation, harvest listings, job posts, seed-company applications, transport partners, content approvals, payout reviews and system incidents.
- Make all privileged actions attributable, reversible where possible, and explainable.
- Keep customer/farmer workflows separate from internal operations.
- Keep Bangladesh-first UX: Bengali default, optional English, BDT formatting, Asia/Dhaka timestamps, mobile-friendly tables and low-bandwidth-friendly screens.

## Proposed information architecture

Use the existing `/admin` route namespace; add a dedicated Super Admin section without duplicating existing pages.

- **Overview** — actionable queues, order/payment reconciliation exceptions, moderation backlog, database/provider health, and recent audit events. Every KPI links to its filtered source list; no fabricated data.
- **Commerce**
  - Marketplace products and categories
  - Harvest listings
  - Buyer demands
  - Marketplace orders and order lifecycle
  - Payment events/reconciliation (read-only until provider integration is explicitly verified)
  - Commissions, reseller ledger, payouts and settlement exceptions
  - Seed-company applications and verification
- **People & access**
  - User directory, account status and support context
  - Role memberships and capability grants
  - Staff directory with scoped responsibilities
  - Session/security events (never expose tokens or secrets)
- **Trust & safety**
  - Product, harvest, job, transport and content moderation queues
  - Reports/complaints and review outcomes
  - Fraud/abuse signals and rate-limit events, if collected lawfully
- **Agriculture services**
  - Jobs and employer verification
  - Crop diagnosis history/quality monitoring
  - Plant Market catalogue and taxonomy
  - Learning content and correction reports
- **Content & growth**
  - Articles, content drafts/revisions, publishing approvals
  - SEO landing pages, sitemap status, canonical/schema checks
  - Search intelligence and zero-result query opportunities
- **Operations**
  - Service health, schema/migration parity, provider health, failed jobs/webhooks
  - Feature flags and maintenance notices
  - Site settings, storage usage and export jobs
- **Governance**
  - Immutable audit viewer and exports
  - Permission matrix / access review
  - High-risk action approvals
  - Break-glass access review and incident log

Keep existing route pages where they work; refactor incrementally behind shared components and services.

## Authorization model: capability-based RBAC

### Principals

Keep the existing user identity in Supabase Auth. Separate the profile's public/product role from internal staff authorization. Never allow a public signup request or a client-side profile update to self-assign a privileged role.

Suggested staff role presets (presets expand to explicit capabilities):

- `super_admin`: platform-wide access; manages staff and critical settings.
- `admin_operations`: orders, listings, user support and routine platform operations.
- `catalog_moderator`: product/category review only.
- `harvest_moderator`: farmer harvest listing review only.
- `content_editor`: drafts and SEO content; cannot publish unless granted `content.publish`.
- `finance_reviewer`: commission/payout review; no role management.
- `support_agent`: limited user/order read context; no financial or role mutations.
- `analyst_readonly`: aggregated reporting only.

These are design presets, not assumptions about currently valid database role values. Reconcile the actual membership values and migrations before implementation.

### Capabilities

Use explicit permission strings, for example:

- `dashboard.read`
- `catalog.read`, `catalog.create`, `catalog.edit`, `catalog.moderate`
- `harvest.moderate`
- `orders.read`, `orders.transition`, `orders.refund.request`
- `payments.read`, `payments.reconcile`
- `payouts.read`, `payouts.approve`
- `users.read`, `users.suspend`
- `roles.read`, `roles.grant`
- `content.edit`, `content.publish`
- `settings.read`, `settings.write`
- `audit.read`, `audit.export`
- `system.health.read`, `system.recovery.execute`

Deny by default. UI visibility is convenience only; every Route Handler/Server Action must authorize independently, and sensitive database operations must enforce the same rule in SQL/RLS/RPC. Do not rely on `profiles.role` or a hidden button alone.

### Critical access safeguards

- Require MFA for privileged staff, with re-authentication/step-up for role grants, payout approvals, refunds, security settings and break-glass.
- Super Admin cannot grant privileges above their own authority; never allow self-escalation. Consider two-person approval for adding a super admin, changing payout destinations, bulk refunds, or disabling security controls.
- Separate routine admin from security owner; maintain at least two trusted super admins, but no shared accounts.
- Keep service-role keys server-only. Never send them to the browser, logs, analytics or error payloads.
- Audit every privileged read of sensitive user data and every mutation. Store actor, action, target type/id, request/correlation ID, timestamp, reason, before/after diff with secrets/PII redacted, and approval references.
- Audit records should be append-only for normal admins. No UI/API for deleting audit history.
- Use idempotency keys for financial/retryable operations and optimistic concurrency/version checks for state transitions.

## Target architecture

```text
Browser / Admin UI
  -> Next.js /admin pages (layout guard for navigation)
  -> Route Handler / Server Action (schema validation + capability check + rate limit)
  -> Domain service (one operation, typed result, idempotency where needed)
  -> Supabase RPC / constrained SQL transaction (authorization + invariant checks)
  -> Postgres RLS, constraints, audit append
  -> Outbox/event record -> asynchronous worker/provider integrations (where required)

Observability:
  request ID + structured, redacted logs + audit event + health signal
```

### Code organization proposal

- `lib/admin/authz.ts`: `requireUser()`, `requireCapability(capability)`, `requireStepUp()`; fail closed.
- `lib/admin/capabilities.ts`: typed capability registry and role presets; no business logic in UI.
- `lib/admin/audit.ts`: safe audit writer and redaction helpers.
- `lib/admin/validation/`: Zod or equivalent schemas per mutation; strict allowlists.
- `lib/admin/services/`: product moderation, order transitions, payout review, user/role management, content publishing.
- `app/api/admin/**/route.ts`: thin HTTP adapters, no duplicated role checks/business rules.
- `app/admin/**`: page/queue UI with shared filter, pagination, empty/error/loading states.
- `supabase/migrations/**`: additive, reviewed migrations and SQL-level guard functions.
- `scripts/smoke-admin-*.mjs`: route/RPC contracts, capability matrix and audit invariants.
- CI: lint, type check, schema-contract tests, RLS/RPC grants tests, production build, migration parity check.

Do not create a generic unrestricted `/api/admin/sql` or `/api/admin/execute` endpoint.

## Core data and workflows

Prefer existing tables/RPCs where they are correct; add only missing structures after inspecting the actual production project.

- **Access**: role memberships plus explicit capability definitions/grants; role assignment history; enforce privileged grant paths in SQL.
- **Audit**: append-only `admin_audit_log`; consider a separate approval table for two-person actions and immutable action/result status.
- **Operations**: health snapshots and integration status should be generated from safe probes, not from arbitrary DB queries or exposed credentials.
- **Payments**: provider webhook event ID unique constraint, signature verification, idempotent event processing, transactionally reconcile order/payment/commission state, preserve raw provider payload only if necessary and encrypted/redacted.
- **Moderation**: explicit state machines (pending -> approved/rejected/changes_requested; active -> paused/suspended) with actor, timestamp and reason. Reject invalid transitions in SQL, not only the UI.
- **Jobs/crop diagnosis**: schema availability and data-source health must be distinct from a successful empty result. Admin must display a degraded status, not misleading zero counts.
- **Exports**: asynchronous, scoped, time-limited downloads; log who exported what; never include auth tokens or unnecessary personal data.

## Dashboard design

Above the fold:
1. System status strip (database/schema parity, auth, search/AI provider, payment provider, last successful check).
2. Work queues with counts and age (e.g. pending moderation, payout reviews, failed reconciliations).
3. Business KPIs only where source data is confirmed (orders, GMV, active products, verified sellers, conversion); show date range and currency.
4. Recent privileged actions and incidents.
5. Quick actions limited to the user's capabilities.

Every metric should define its source, time window, timezone, currency, refresh policy and empty/error behavior. Avoid combining separate order systems into one number until business definitions and duplicate handling are documented.

## Delivery plan

### Phase 0 — Stabilize and reconcile (must precede new privileged controls)
1. Compare Vercel Production `NEXT_PUBLIC_SUPABASE_URL` (inspect without exposing keys) with the intended Supabase project ID and the host in runtime logs.
2. Establish the single production project and verify migrations, tables, columns, RPCs and RLS there. No schema writes until identity is confirmed.
3. Reproduce/fix Jobs, Plant Market, Smart Search and crop-diagnosis errors against that exact project; add schema parity checks to CI.
4. Fix Supabase SSR cookie/session refresh errors in the supported Next.js context; add auth smoke tests.
5. Verify admin product creation end-to-end with a legitimate test admin account in a safe environment; don't ask anyone to share credentials.
6. Keep online payment disabled until the provider account, signature validation, callback URLs and reconciliation are verified end-to-end.

### Phase 1 — Authorization foundation
- Introduce one shared capability guard and contract tests.
- Reconcile `profiles.role`, membership rows, SQL helper functions, layout guards and every admin API.
- Add capability-matrix tests: anonymous denied; ordinary user denied; moderator limited to own domain; admin restricted to grants; super admin can manage staff only with step-up.
- Add append-only audit events for each privileged mutation.
- Deploy behind existing route compatibility; no broad role rewrite in one migration.

### Phase 2 — Operational console
- Dashboard + queue counters; product/harvest/job/seed-company moderation; user and role views; order and payout review.
- Server-side pagination/filtering, bounded result sizes, accessible keyboard flows, Bengali labels, safe CSV exports.
- Each action has reason, preview, confirmation and audit result.

### Phase 3 — Governance & intelligence
- Two-person approvals for high-risk actions, audit explorer, access review, incident center.
- SEO/content workflow and real-inventory signals; search zero-result insights.
- Provider health and safe reconciliation tooling; alerts only after thresholds and ownership are defined.

### Phase 4 — Hardening
- Threat model, dependency audit, secret scan, RLS policy review, rate limits, abuse tests, backup/restore drill, rollback runbook.
- Test at mobile widths and slow networks; verify keyboard/screen-reader behavior.
- Track admin action latency, failure rate, denied actions, audit write failures and stale queue age.

## Definition of done

- Every admin mutation is protected in the server and database; direct API calls cannot bypass UI permissions.
- Every privileged mutation emits a durable audit event; failed audit writes fail the operation for critical actions.
- No production project ambiguity remains; migration ledger and live schema are reconciled.
- Tests cover anonymous/user/moderator/admin/super-admin capability boundaries and state transitions.
- Dashboard never silently converts failed queries into zero values.
- Sensitive data is minimized and redacted; exports are scoped and audited.
- Payment activation and irreversible actions require explicit operational approval and successful sandbox/e2e evidence.
- Rollback and incident response instructions are documented.

## Decisions to confirm during implementation

1. Which Supabase project is authoritative for Vercel Production? Current inspected project and historical runtime-log host differ.
2. Should staff use mandatory MFA from day one? Recommendation: yes.
3. Which people may approve refunds/payouts and role grants? Recommendation: separate duties.
4. What are the canonical definitions for GMV, successful order, active listing, commission liability and payout-ready balance?
5. Which features are production-ready versus hidden/experimental? Drive visibility from explicit feature flags and verified health, not assumptions.
