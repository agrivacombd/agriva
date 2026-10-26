# Admin Authorization Audit and Release Gate

## Scope and current model

The current application uses `profiles.role = 'admin'` as the elevated application role. The `/super-admin` page is a navigation hub, not a separate database role. Do not introduce a `super_admin` role or new business roles until the capability matrix and each affected RLS policy/RPC have been designed and tested.

## Role and capability matrix

| Capability | Anonymous | Signed-in user | Admin |
| --- | --- | --- | --- |
| Browse public marketplace content | Allowed only where public policy permits | Allowed | Allowed |
| Manage own profile/cart/orders | No | Own records only | No implicit cross-user access |
| Create/manage own listings or job applications | No | Only where the feature's policy permits | Allowed only through documented admin workflows |
| Moderate harvest/job/transport submissions | No | No | Yes, through guarded RPCs |
| Change another user's role | No | No | Restricted to approved non-privileged roles; never self-promote |
| View audit logs / admin reports | No | No | Yes |
| Change site-wide settings | No | No | Yes |

This is a baseline for review, not a substitute for inspecting every table policy and function. Admin status must come from a trusted server/database check, never user-editable metadata.

## Required authorization layers

1. Every `/admin` page is guarded by `app/admin/layout.tsx`.
2. Every Route Handler under `app/admin/**/route.ts` or `app/api/admin/**/route.ts` performs its own session and role checks; layouts do not protect Route Handlers.
3. Every Server Action checks authorization at execution time, even when the calling page is protected.
4. Every privileged RPC validates `auth.uid()` and the database-backed admin role itself, validates input, and writes an audit event for sensitive changes.
5. RLS policies and grants are independently reviewed. A `SECURITY DEFINER` function is not safe merely because its name begins with `admin_`.
6. Any migration changing privileges or workflow behavior must be applied to a disposable/staging database first and tested with anonymous, ordinary-user, and admin contexts.

## Audit findings to resolve before production

- The Supabase Security Advisor reports five `SECURITY DEFINER` functions callable by `anon` and 28 callable by `authenticated`. Some may be intentionally public (for example, public settings/search/attribution); each function must be reviewed individually for grants, input bounds, data exposure, and authorization. Do not blanket-revoke all functions without checking product behavior.
- The live `admin_set_user_role` function adds the selected role to `user_role_memberships` but does not remove stale membership rows. Before changing this, determine whether that table intentionally represents multiple simultaneous capabilities or mirrors `profiles.role`; then add a migration and tests matching the chosen model.
- Added PR-only migration `20261027193000_harden_marketplace_order_transitions.sql` to restrict order state transitions by buyer/seller/admin, reject invalid transitions, and avoid automatically restocking inventory on refunds. This is a proposed conservative policy and must be confirmed against the product's intended workflow in staging. Payout review finding: `request_commission_payout` reserves approved balance against requested/approved payouts, but `complete_commission_payout` settles whole approved commission rows only. A requested amount that cannot be composed from whole commission rows can fail with `Insufficient approved commission balance` even when aggregate balance is sufficient. Decide whether payouts must equal whole commission rows or introduce an auditable allocation/ledger model before enabling partial payout amounts. The completion function also accepts `requested` directly, so confirm whether that approval bypass is intended.
- The harvest moderation hardening migration exists in the PR but has not been applied to production. Verify it in staging before release.
- A passing CI build does not prove RLS behavior or live permissions; test with real role-specific sessions in staging.

## Release checklist

- [ ] Dynamic route-handler authorization smoke test passes.
- [ ] Lint, TypeScript, regression tests, and production build pass on the exact PR head.
- [ ] Anonymous requests to privileged RPCs are denied; intended public RPCs expose no private data.
- [ ] Ordinary users cannot call admin RPCs directly or alter roles/ownership fields.
- [ ] Admin role changes are audited and cannot grant admin privileges.
- [ ] Order state-machine migration is validated against the intended buyer/seller/admin workflow in staging.
- [ ] Order/commission/payout state transitions pass positive and negative tests.
- [ ] Harvest/job/transport moderation RPCs enforce status and note validation and create audit records.
- [ ] Mobile, tablet, and desktop staging smoke tests are complete.
- [ ] Database migrations and security advisor findings are reviewed in staging.
- [ ] Keep the PR Draft until all release gates are satisfied; do not apply migrations or deploy to production as part of this audit.
