# AGRIVA Module Access Architecture (Feature Branch)

## Security model
A profile role or signup selection describes a user's interests; it is not an authorization grant. Access to a seller module is granted only after a separately reviewed application. Backend handlers and Supabase RLS must enforce the same grant.

## Module access matrix
| Module | Required grant | Approval evidence |
| --- | --- | --- |
| Plant Market | plant_market:create | Gardener identity and ornamental/plant activity review |
| Marketplace | marketplace:create | Verified company/shop/dealer organization |
| Sell Harvest | sell_harvest:create | Verified farmer profile |
| Buyer Demands | buyer_demands:create | Any authenticated account; no seller verification |
| Transport | transport:create / manage_orders | Transport partner verification |
| Farms | farm_management:* | Farm ownership or explicit farm membership |

## Tables introduced
- module_access_applications: self-submitted, pending-only applications; admins review.
- user_module_grants: approved permissions with global, organization, or farm scope and expiry/revocation.
- organizations / organization_members: business tenancy and staff membership.
- farmer_profiles: farmer verification record.
- farm_members: scoped farm staff.
- admin_roles, admin_role_permissions, admin_user_roles: delegated admin capabilities.

## Rollout notes
1. This migration is additive and is not applied by this branch.
2. Existing role memberships are preserved. No role is automatically converted into an approved module grant.
3. Existing API routes are not yet switched to the new helper. Migrate one module at a time after integration tests and data backfill rules are approved.
4. Buyer Demands remains open to authenticated users.
5. Add organization/farm ownership checks to every resource query in addition to checking module access.
6. Do not seed admin grants from legacy profiles.role without an explicit, audited administrator mapping.
7. Review existing broad table grants/default privileges separately; RLS does not protect TRUNCATE.

## Required validation before production
- Apply migration only to an isolated Supabase test project.
- Verify anonymous access denied to all new tables.
- Verify users cannot approve applications or insert/update their own grants.
- Verify global grants, scoped grants, expired grants, revoked grants, and cross-tenant denial.
- Verify delegated admin capabilities and expiry.
- Add per-module API and RLS integration tests before switching existing endpoints.
