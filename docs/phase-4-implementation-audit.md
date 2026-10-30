# Phase 4 — Optional Modules: implementation audit

## Repository baseline

This branch extends existing AGRIVA modules rather than creating parallel versions.

| Module | Existing implementation found | Phase 4 work in this branch |
|---|---|---|
| Green Exchange | Listings, requests, moderation, completion confirmation, security smoke test | Retained; no duplicate schema |
| Personal Garden | Private owner-scoped plants, care tasks, activity logs, RLS and privacy checks | Retained; no duplicate schema |
| Learning correction | Admin correction inbox with pending/approved/rejected/needs-info review states | Retained; test coverage added |
| Plant Market taxonomy | Stable product category/subcategory taxonomy and admin taxonomy editor | Adds a dedicated plants-and-gardening category with seven subcategories |
| Seller expansion | Seller/organization role membership, seller product submission, draft moderation and schema compatibility | Retained; no duplicate seller model |
| Payout approval | Existing request/approve/settle RPC flow | Adds a database-level AAL2 gate and audit events for approval and settlement |

## Payout MFA boundary

The migration adds a BEFORE UPDATE OF status trigger to public.commission_payouts. Any human-session transition to approved or paid requires:

1. A verified Supabase JWT with aal = aal2.
2. A persisted profiles.role = admin check.
3. An audit event in public.admin_audit_log.

A trusted service-role JWT is allowed for explicitly trusted server-side operations. Client-editable user metadata is not used for authorization. The existing payout RPCs remain in place; this trigger is a final database guard against direct status updates as well.

## Rollout

1. Review and apply 20261031010000_phase4_optional_modules.sql in the Supabase migration workflow.
2. Deploy the application branch.
3. Verify admin payout approval and settlement with an AAL2 session.
4. Verify AAL1 and non-admin attempts fail with SQLSTATE 42501.
5. Verify audit events are written for approved and paid transitions.
6. Run npm run test:phase4 and the existing Green Exchange, Green Living, taxonomy, seller-submission, and payout regression scripts.

This commit does not apply migrations to production or move money. The migration must be reviewed and applied through the project's normal Supabase release process.
