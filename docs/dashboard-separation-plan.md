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
