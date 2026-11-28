# AGRIVA Admin RBAC & Audit Review

Review date: 2026-11-28
Repository: `agrivacombd/agriva`
Reviewed ref: `feat/agriva-admin-2.0`
Scope: static code review of the shared admin layout, capability helpers, access-control page, audit page, application-review server action, and representative admin API handlers.

## Executive summary

The existing legacy admin boundary is consistently visible in the reviewed shared layout and representative API handlers: `requireAdminPage` / `requireAdminApi` check the authenticated Supabase user and the `profiles.role = 'admin'` role before allowing legacy capabilities. High-risk payment, payout, refund and recovery capabilities are deny-by-default in `lib/admin/authz.ts`.

A second delegated permission path also exists through `checkAdminPermission()` and the `has_admin_permission` RPC. The two paths currently have different capability vocabularies and are composed differently by the access-control page and shared admin layout. This is the main governance issue to resolve before delegated-admin access is enabled for non-super-admin users.

This is a static source review, not a full route-by-route penetration test or a live production authorization test.

## Findings

### RBAC-01 — Legacy and delegated capability systems are not unified
**Priority: High before delegated-admin rollout**

Evidence:
- `lib/admin/authz.ts` defines the `AdminCapability` union and grants the legacy `profiles.role = 'admin'` principal a fixed set of capabilities through `LEGACY_ADMIN_CAPABILITIES`.
- `lib/admin/permission-service.ts` defines a separate capability union and calls `has_admin_permission`; its comment explicitly says delegated grants do not inherit legacy profile-role grants.
- `app/admin/access-control/page.tsx` checks delegated `roles.grant`, then separately calls `requireAdminPage("dashboard.read")`.
- `app/admin/layout.tsx` wraps every `/admin` page in `requireAdminPage("dashboard.read")`.
- Representative admin API handlers use `requireAdminApi`, i.e. the legacy capability system.

Impact:
- A delegated user without the legacy admin profile role cannot reach the admin shell even if the database RPC grants a delegated capability.
- A legacy admin who can reach the shell may also pass legacy API checks independently of the delegated role assignment. This is consistent with the current migration strategy, but must not be mistaken for delegated RBAC enforcement.
- The two capability lists can drift; matching labels such as `roles.grant` or `audit.read` do not establish that the same policy is being evaluated.

Recommendation:
1. Keep delegated grants disabled for production access until the intended principal model is explicit.
2. Create one canonical capability registry and a documented route/action-to-capability matrix.
3. Decide whether delegated users are allowed into the admin shell; if yes, change the shared layout boundary deliberately and preserve per-page, per-API and per-action checks.
4. Add integration tests for legacy admin, delegated admin, ordinary authenticated user, expired assignment, wrong scope, and authorization-service failure.
5. Never let UI navigation visibility substitute for server authorization.

### RBAC-02 — Access-control screen is read-only, which is the correct current safety posture
**Status: Guardrail present**

Evidence:
- The page renders roles, capabilities and current assignments but exposes no grant/revoke mutation in the reviewed file.
- The page itself warns that safe grant/revoke, privilege-escalation protection, expiry validation and audit RPC validation are release prerequisites.
- The access-control page fails closed when the permission RPC cannot be verified.

Recommendation:
- Preserve read-only mode until a server-only grant/revoke workflow exists with actor authorization, target-role constraints, scope validation, expiry validation, self-escalation prevention, atomic database enforcement and immutable audit evidence.

### AUDIT-01 — Audit UI documents limited event coverage
**Priority: Medium; verify before relying on audit log for compliance**

Evidence:
- `app/admin/audit/page.tsx` describes the currently recorded activity as product updates and user-role changes.
- The page displays up to 100 records and exposes metadata JSON to users who pass `audit.read`.
- The reviewed application-review server action revalidates the audit page after an application decision, but this alone does not prove that the decision is persisted in the audit table.

Recommendation:
1. Inventory every privileged mutation (identity review, seller application decisions, product moderation, content publishing/deletion, settings changes, role grants/revokes, payment reconciliation and payout actions).
2. For each action, verify a database-side audit record is written atomically with the mutation; do not rely only on client-side logging or page revalidation.
3. Define and test metadata redaction so tokens, secrets, phone numbers, addresses and unnecessary personal data are never stored or displayed.
4. Add pagination and explicit unavailable/error states before treating the page as a complete audit history.

### API-01 — Reviewed representative API handlers authorize server-side
**Status: Positive observation, limited sample**

The reviewed handlers for AI article generation, content brief, content opportunities, Google Trends, Plant Market products, product creation, recent orders and SEO pages call `requireAdminApi` before privileged database access or external provider use. Mutating operations use separate legacy capabilities where inspected.

This sample does not establish that every API route, Server Action, cron endpoint or database RPC is correctly authorized. A complete automated route inventory and authorization test suite is still required.

## Safe implementation sequence

1. Keep current legacy admin access behavior unchanged while PR #408 is under review.
2. Build a route/action capability inventory and test it without changing production permissions.
3. Verify the SQL definition and grants of `has_admin_permission` and every role-management RPC in a non-production database.
4. Add automated tests for authorization denial, expiry, scope, self-escalation and audit atomicity.
5. Only then design delegated-admin rollout behind an explicit migration and release gate.

## Scope and limitations

- No production database, role assignment, policy, grant, or user data was changed.
- No new admin privileges were granted.
- No production deployment was performed.
- This review did not execute live authorization tests against production.
- Browser QA of the current PR head remains pending because the Vercel free deployment quota was reached.
