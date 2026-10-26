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
