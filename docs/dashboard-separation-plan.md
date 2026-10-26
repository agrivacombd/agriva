# Separate User and Super Admin Dashboards — Draft Plan

## Route contract
- `/dashboard`: authenticated farmer/buyer/reseller workspace; no admin navigation or privileged aggregates.
- `/super-admin`: separate privileged navigation hub; requires verified auth and exact `profiles.role === "admin"`; any auth/profile query error fails closed.
- `/admin/*`: existing administration pages remain separately guarded. The UI is not an authorization boundary; each API route and Server Action must independently verify the role.

## Phases
1. Draft: separate user navigation, add dedicated super-admin route, and fail closed on admin profile lookup errors.
2. Audit all admin pages, APIs and Server Actions for independent role checks and user data scoping.
3. Run lint, TypeScript, regression tests and production build against the exact PR head.
4. Verify production schema/RLS read-only and manually test unauthenticated, ordinary-user/admin access.
5. Release only after blockers are resolved and explicit approval is given.

## Security requirements
- Verify sessions server-side with `auth.getUser()`; never trust client role claims.
- Fail closed on auth/profile lookup errors.
- Keep user queries scoped to the authenticated user and verify RLS separately.
- Never expose privileged PII, payment data or audit logs on the user dashboard.
- Add tests for unauthenticated, ordinary-user, admin and profile-query-error cases.

## Limitations and safety
This is a repository change, not proof of production schema, RLS or live role assignments. No migration, production write, merge or production deployment is included.

## Initial route audit — 2026-10-27

Static review of the current `main` branch found these concrete follow-up items. This is a source review only; it does not establish live production behavior.

### Findings to address before release

1. **Admin guard consistency:** `app/admin/users/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/products/page.tsx`, `app/admin/orders/page.tsx`, and `app/admin/reports/page.tsx` originally lacked explicit checks for auth/profile query errors. Those guards have since been hardened in this draft branch.
2. **Server Action authorization:** pages with mutations must repeat authorization inside each Server Action (or call a server-only guard). A page-level guard alone is insufficient because actions can be invoked independently. Continue checking every mutation and RPC grant.
3. **Client-rendered admin surface:** `app/admin/content-studio/page.tsx` is a client component. Its `/api/admin/content-brief` endpoint performs server-side auth and exact admin-role checks, and `app/admin/layout.tsx` provides a server-side page gate. Keep the API guard as the security boundary.
4. **Publishing endpoint:** the content-draft publishing endpoint checks authentication and profile role server-side and fails closed on profile lookup error. Validate its status-transition logic, audit logging and database-side permissions before treating publishing as production-ready.
5. **CI status:** workflow configuration alone is not evidence that the current PR head passed; verify the exact head SHA and every required job.

### Next audit sequence

- Inventory every `app/admin/**/page.tsx`, `app/admin/**/route.ts`, `app/api/admin/**/route.ts`, and mutation-capable Server Action.
- Normalize guards to reject auth errors, missing users, profile query errors, and non-admin roles.
- Add focused regression tests for the failure modes above.
- Review RLS and privileged RPC grants separately; client/server UI guards do not replace database authorization.
- Re-run CI against the exact PR head and record actual results here.

No production migration, production write, merge or deployment was performed for this audit.

## Follow-up implementation — 2026-10-27 (admin mutation audit)

### Changes made

- Updated local admin guards in `app/admin/transport/page.tsx`, `app/admin/harvest/page.tsx`, and `app/admin/jobs/page.tsx` to reject session/profile lookup errors and missing/non-admin profiles.
- Extended `scripts/smoke-admin-authorization.mjs` with source assertions for fail-closed guards, transport/job moderation RPC usage, allowed job moderation statuses, and article review/generation regressions.
- Confirmed from checked-in migrations that transport verification and job moderation have admin-only SECURITY DEFINER RPCs with role checks and restricted grants.

### Findings that remain blockers

- **Harvest moderation needs database-level verification before release.** `app/admin/harvest/page.tsx` currently performs a direct `harvest_listings` UPDATE for `moderation_status` and `moderation_note`. The migration inventory in this branch does not contain the table definition or an explicit admin moderation RPC/policy for this table. Inspect the actual deployed schema and add a reviewed least-privilege database mutation path if needed.
- `app/api/admin/content-opportunities/route.ts` has an admin role guard and checks status transitions, but live RLS and audit requirements still need independent verification.
- The source-based regression script is a guardrail; it does not prove runtime authorization or live database policy behavior.

## Follow-up implementation — 2026-10-27 (moderation RPC validation)

- Hardened `admin_set_transport_partner_verification` and `admin_moderate_job_post` so `NULL` status arguments are explicitly rejected. In SQL, `NULL NOT IN (...)` evaluates to unknown, so a plain `IF status NOT IN (...)` does not enter the rejection branch.
- Added source assertions for both null/unsupported-status checks. The jobs RPC records status transitions in `job_moderation_events`; transport verification stores reviewer/time/note on the partner record but does not create a separate event-history table in this migration.
- **Harvest moderation remains blocked:** the page still performs a direct UPDATE to `harvest_listings`, while this branch's migration inventory does not define that table or its RLS/update policy. Verify the deployed table/policies and use a least-privilege admin RPC plus audit history if existing protections are insufficient. Do not invent a migration without authoritative schema.

## Follow-up implementation — 2026-10-27 (admin read error states)

- Hardened local guards in `app/admin/categories/page.tsx`, `app/admin/opportunities/page.tsx`, and `app/admin/audit/page.tsx` to fail closed on session/profile query errors.
- Updated `app/admin/orders/page.tsx` to distinguish a failed query from a genuinely empty order list; the empty state is suppressed on query failure.
- Updated `app/admin/reports/page.tsx` to withhold aggregate metrics if any of its four source queries fails, with a Bengali explanation.
- Updated `app/admin/opportunities/page.tsx` to surface its query failure and avoid showing “No search opportunities yet” when the data request fails. Added source assertions for this behavior in `scripts/smoke-admin-authorization.mjs`.

## Exact-head CI observation — 2026-10-27

GitHub Actions run **40414314964** for PR head `c42d58623cf0580cc67bd4d59a7eed2d3093bd38` completed successfully. Its `quality` job reported success for dependency install, lint, TypeScript, the admin authorization regression test and the other configured regression scripts, and production build. This result applies to that exact SHA only; subsequent commits changing opportunity error handling and its regression assertions require a new exact-head CI run.

Live Supabase access was unavailable in this session, so deployed RLS/grants remain unverified. The PR remains Draft. No migration was executed, and no merge or deployment was performed.
