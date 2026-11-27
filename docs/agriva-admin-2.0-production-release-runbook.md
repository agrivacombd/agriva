# AGRIVA Admin 2.0 — Production Release Runbook

## Release gates

Do not merge or deploy until all of the following are freshly verified against the current PR head:

- The independent reviewer approval is still valid for the latest commit.
- Every required GitHub check is successful.
- The PR is mergeable and the repository's actual branch-protection requirements are satisfied.
- The existing Vercel Free deployment quota is available. Do not upgrade the plan or create paid resources.
- The current production Supabase schema supports the migrations below. Use only synthetic data for functional tests.

## Coordinated rollout order

The production Buyer Demand page currently selects `buyer_demands.contact_phone`. The new app removes that column from its select list. Therefore, **never apply the phone-column privilege migration before the new app is confirmed live**.

1. Merge PR #408 only after all release gates pass. The Vercel production deployment is expected to build the merged `main` commit.
2. Verify the Vercel deployment reaches `READY`, its Git SHA equals the merged commit, and `agriva.com.bd` is assigned to that deployment.
3. Verify the updated public Buyer Demand page returns HTTP 200 and its PostgREST select list does not contain `contact_phone`. Verify unauthenticated admin routes still redirect to login.
4. Apply the Supabase migrations using the official migration mechanism, in this order:
   - `20261128000000_harden_crop_feed_make_slug_search_path.sql`
   - `20261128030000_buyer_demand_to_bulk_rfq_transaction.sql`
   - `20261128040000_restrict_buyer_demand_phone_column_after_app_rollout.sql`
5. The app handles the brief interval before the RFQ RPC exists by returning HTTP 503 with a retry message. After the RFQ migration is applied, verify authenticated owner conversion, foreign-owner denial, anonymous denial, idempotent retry, and `pending_review` status using synthetic fixtures only.
6. Apply the phone privilege migration last. It removes table-wide SELECT and explicitly revokes SELECT on `contact_phone`; the updated app must already be live before this step.
7. Verify migration history, table/column privileges, function EXECUTE grants, mapping-table RLS, and Supabase security/performance advisors. Verify the public board still works after the privilege change.
8. Recheck the production deployment and these routes: `/buyer-demands`, `/admin/command-center`, `/admin/demand-intelligence`, `/admin/growth-intelligence`, and the RFQ conversion API.

## Stop conditions

Stop immediately and report the exact blocker if the latest approval/check is missing, branch-protection requirements cannot be verified, the Vercel Free quota is still limited, the deployment is not READY, the deployed SHA/domain do not match, any migration precondition fails, or any post-migration privilege/route test fails.

Never apply production migrations speculatively, bypass required checks, mutate real customer rows, or claim success without independent verification.
