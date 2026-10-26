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
This is a repository change, not proof of production behavior. No production migration, production write, merge or production deployment is included.

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

- Updated local admin guards in `app/admin/transport/page.tsx`, `app/admin/harvest/page.tsx`, and `app/admin/jobs/page.tsx` to reject session/profile lookup errors and missing/non-admin profiles.
- Extended `scripts/smoke-admin-authorization.mjs` with source assertions for fail-closed guards, transport/job moderation RPC usage, allowed job moderation statuses, and article review/generation regressions.
- Confirmed from checked-in migrations that transport verification and job moderation have admin-only SECURITY DEFINER RPCs with role checks and restricted grants.

## Moderation RPC validation — 2026-10-27

- Hardened `admin_set_transport_partner_verification` and `admin_moderate_job_post` so `NULL` status arguments are explicitly rejected.
- Added source assertions for both null/unsupported-status checks. The jobs RPC records status transitions in `job_moderation_events`; transport verification stores reviewer/time/note on the partner record but does not create a separate event-history table in that migration.

## Admin read error states — 2026-10-27

- Hardened local guards in `app/admin/categories/page.tsx`, `app/admin/opportunities/page.tsx`, and `app/admin/audit/page.tsx` to fail closed on session/profile query errors.
- Updated `app/admin/orders/page.tsx` to distinguish a failed query from a genuinely empty order list.
- Updated `app/admin/reports/page.tsx` to withhold aggregate metrics if any of its four source queries fails.
- Updated `app/admin/opportunities/page.tsx` to surface its query failure and avoid a false empty-state message.

## Production database read-only audit — 2026-10-27

Read-only inspection of the connected Supabase project `agriva` (project ref `utytcoxpjnoanqffkqft`) confirmed that `public.harvest_listings` exists and RLS is enabled. Its current `guard_harvest_listing_moderation()` trigger resets `moderation_status` and `moderation_note` only when a non-admin changes the status. A non-admin changing only `moderation_note` does not enter that branch, so the old note can be replaced. This is a concrete production security bug.

The live policy allows authenticated owners to update their own rows; table-level UPDATE grants are present. The trigger is therefore an important additional guard, and its note-only gap needs a migration. The same read-only audit confirmed `admin_audit_log` has the columns needed to record moderation changes.

### Fix committed to this PR (not applied to production)

- Added `supabase/migrations/20261027190000_harden_harvest_moderation.sql` to protect both moderation fields whenever either changes, unless the caller is an admin.
- Added SECURITY DEFINER RPC `admin_moderate_harvest_listing`, which verifies the current admin profile, validates the status and note, rejects blank reasons for rejection, locks the target listing, performs the update, and records before/after moderation details in `admin_audit_log`.
- Updated `app/admin/harvest/page.tsx` to call that RPC instead of directly updating the table.
- Added source regression assertions for the RPC call, trigger note protection, audit write, and revoked PUBLIC/anon execution.

The migration is committed to the PR branch only. It has **not** been applied to production. Verify its SQL against a disposable database or preview branch and review the resulting RLS/RPC behavior before release.

## CI findings

GitHub Actions run **40415279282** failed on exact head `676ccf586b1dcfbd6b4d2eb4124b9addd64b1d76`: lint and TypeScript passed, but `test:admin-authorization` failed because the article Markdown source assertion expected escaped newline characters while the implementation contains actual line breaks. The regression assertion has been corrected in a later commit; a fresh exact-head run is required to confirm it passes.

Vercel has a ready preview deployment for earlier commit `5d52709794c8ddea2248f7812d8adf40e2c6c9bd`, not the latest branch head. A prior Vercel comment reported the free-plan deployment limit (more than 100 deployments per day). Do not promote the old preview or claim the current commit is deployed.

Supabase Security Advisor also reports SECURITY DEFINER functions executable by `anon` or `authenticated`. Some are intentionally public tracking/attribution RPCs, while admin RPCs are expected to be callable by authenticated users only when the function itself verifies the admin role. Review each finding's function body and intended public contract before changing grants globally; blanket revocation could break signup, attribution, search, cart, or payment flows.

The PR remains Draft. No production migration, merge, or deployment was performed.
