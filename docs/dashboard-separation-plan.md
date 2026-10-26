# Separate User and Super Admin Dashboards — Draft Plan

## Route contract
- `/dashboard`: authenticated farmer/buyer/reseller workspace; no admin navigation or privileged aggregates.
- `/super-admin`: separate privileged navigation hub; requires verified auth and exact `profiles.role === "admin"`; any auth/profile query error fails closed.
- `/admin/*`: existing administration pages remain separately guarded. The UI is not an authorization boundary; each API route and Server Action must independently verify the role.

## Phases
1. Draft: separate user navigation, add dedicated super-admin route, and fail closed on admin profile lookup errors.
2. Audit all admin pages, APIs and Server Actions for independent role checks and user data scoping.
3. Run lint, TypeScript, regression tests and production build against the exact PR head.
4. Verify production schema/RLS read-only and manually test unauthenticated, ordinary-user and admin sessions.
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

1. **Admin guard consistency:** `app/admin/users/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/products/page.tsx`, `app/admin/orders/page.tsx`, and `app/admin/reports/page.tsx` verify that a user exists and then inspect `profiles.role`, but the shown guards do not explicitly check `auth.getUser()` errors or profile-query errors. Missing profile data currently redirects away, but explicit fail-closed error handling should be consistent and testable.
2. **Server Action authorization:** pages with mutations must repeat authorization inside each Server Action (or call a server-only guard). A page-level guard alone is insufficient because actions can be invoked independently. `app/admin/users/page.tsx` and `app/admin/settings/page.tsx` appear to call a local guard from actions; continue checking every mutation and RPC grant.
3. **Client-rendered admin surface:** `app/admin/content-studio/page.tsx` is a client component and does not itself enforce access. Its `/api/admin/content-brief` endpoint does perform server-side auth and exact admin-role checks. Keep the API guard as the security boundary and consider adding a server-protected page wrapper for a consistent user experience.
4. **Publishing endpoint:** `app/admin/content-drafts/publish/route.ts` checks authentication and profile role server-side and fails closed on profile lookup error. Continue validating the remainder of its status-transition logic, audit logging and database-side permissions before treating publishing as production-ready.
5. **CI status:** the workflow `.github/workflows/ci.yml` is configured for pull requests targeting `main`, and includes lint, TypeScript, security regression scripts and a production build. Workflow configuration alone is not evidence that the current PR head passed; verify the exact head SHA and every required job.

### Next audit sequence

- Inventory every `app/admin/**/page.tsx`, `app/admin/**/route.ts`, `app/api/admin/**/route.ts`, and mutation-capable Server Action.
- Normalize guards to reject auth errors, missing users, profile query errors, and non-admin roles.
- Add focused regression tests for the failure modes above.
- Review RLS and privileged RPC grants separately; client/server UI guards do not replace database authorization.
- Re-run CI against the exact PR head and record actual results here.

No production migration, production write, merge or deployment was performed for this audit.


## Follow-up implementation — 2026-10-27

### Changes made on this draft branch

- Added `app/admin/layout.tsx` as a defense-in-depth server-side gate for every page under `/admin`, including client-rendered admin screens. It verifies the session with `auth.getUser()`, checks `profiles.role`, and redirects on authentication/profile lookup errors or a non-admin role.
- Hardened `app/api/admin/article/generate/route.ts` to fail closed on authentication and profile lookup errors, bound the keyword length, and avoid returning raw database error messages.
- Hardened `app/api/admin/content-drafts/generate/route.ts` to fail closed on authentication/profile lookup errors and avoid returning raw database error messages. It now reports a failure if the related opportunity status update fails instead of silently ignoring it.
- Added `scripts/smoke-admin-authorization.mjs`, wired it to `npm run test:admin-authorization`, and added the check to CI.

### Important scope boundary

The admin layout protects page rendering only. It does **not** replace independent authorization inside API Route Handlers, Server Actions, RPCs, or database policies. Existing page-local guards and action-local guards remain in place; the new static regression check is a guardrail, not a substitute for reviewing every action and endpoint. The check is intentionally source-based and does not prove runtime authorization or live database policy behavior.

### Remaining release blockers

1. Run the new authorization regression script plus the full CI workflow against the latest exact PR head; confirm lint, TypeScript, all existing security regression scripts, and production build pass.
2. Complete a line-by-line audit of all admin Server Actions, API handlers, CSV/export endpoints, and privileged RPCs. Confirm profile lookup errors return a deny response and no route leaks raw database/provider errors.
3. Review every exposed Supabase table, view, storage bucket, and RPC against the actual deployed schema. Confirm RLS is enabled where required, ownership predicates prevent IDOR, UPDATE policies include both `USING` and `WITH CHECK`, and privileged functions have least-privilege grants/search paths.
4. Run tests with unauthenticated, ordinary user, admin, profile-query failure, cross-user record IDs, and direct API/Server Action invocation. Verify a normal user cannot read or mutate another user's farm, crop, order, listing, application, profile, or private data.
5. Verify live schema and policies read-only against the intended Supabase project, then obtain explicit release approval. Do not run migrations, merge, or deploy as part of this draft audit.

### Current CI observation

At the time of this note, the GitHub Actions `quality` job for the original head `68bc544427a157bbc0ef1a2eccfd8db31e536ea5` was still in progress. The Vercel status for that head reported a deployment rate limit and Netlify preview was also still processing. These are not evidence that quality checks passed. All CI must be re-evaluated after the follow-up commits, against the new head SHA.


## Follow-up implementation — 2026-10-27 (admin mutation audit)

### Changes made

- Updated the local admin guards in `app/admin/transport/page.tsx`, `app/admin/harvest/page.tsx`, and `app/admin/jobs/page.tsx` to reject both session lookup errors and profile lookup errors, as well as missing/non-admin profiles.
- Extended `scripts/smoke-admin-authorization.mjs` with source assertions for these fail-closed guards, transport/job moderation RPC usage, allowed job moderation statuses, and article review/generation regressions.
- Confirmed from the checked-in migrations that transport verification and job moderation have admin-only SECURITY DEFINER RPCs with role checks and restricted grants.

### Findings that remain blockers

- **Harvest moderation needs database-level verification before release.** `app/admin/harvest/page.tsx` currently performs a direct `harvest_listings` UPDATE for `moderation_status` and `moderation_note`. The migration inventory in this branch does not contain the table definition or an explicit admin moderation RPC/policy for this table. Do not assume the live RLS policy is correct; inspect the actual deployed schema and add a reviewed least-privilege database mutation path if needed.
- `app/api/admin/content-opportunities/route.ts` uses an admin role guard and checks status transitions, but the corresponding live RLS and audit requirements still need independent verification.
- These changes and assertions have been inspected at source level; the test script has **not** been run in a checked-out repository in this session.

### Exact-head validation

The current branch head after these commits must be used for CI verification. GitHub Actions returned no pull-request workflow runs for the latest checked head, and the only reported commit status was Vercel's build-rate-limit failure. Therefore lint, TypeScript, regression tests, and production build are not verified passing. Live Supabase project access was unavailable, so deployed policies and grants remain unverified.

No migration was executed; the PR remains Draft; no merge or deployment was performed.
