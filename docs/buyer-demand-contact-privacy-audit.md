# Buyer Demand Contact Privacy Audit

## Finding — release blocker

The production schema grants both `anon` and `authenticated` SELECT access to `public.buyer_demands.contact_phone`. This was verified using PostgreSQL privilege metadata only; no customer rows or phone values were queried.

The table's public-read RLS policy permits active, non-expired demand rows. RLS is row-level, not column-level, so a client can request the `contact_phone` column directly even when `contact_phone_public = false`. Hiding the number in the React UI does not protect the PostgREST API.

Effective privilege checks returned:

| Role | Table SELECT | contact_phone SELECT |
|---|---:|---:|
| anon | true | true |
| authenticated | true | true |

## Development mitigation in this PR

- Public demand discovery no longer selects `contact_phone` as part of its broad row query.
- Buyer phone values are no longer fetched by the board, even for opted-in rows; public phone display is disabled until a separately reviewed server-side contact-sharing path exists.
- The buyer-owned query also uses the phone-free column allowlist.
- A regression test protects this client-side data minimization.

**This is not a complete security fix.** Direct API reads remain possible until database privileges are corrected.

## Required database remediation before release

1. Deploy the updated app first. The current production app selects `contact_phone`; applying the restriction before the app update would break the live board.
2. After the updated app is confirmed live, apply `20261128040000_restrict_buyer_demand_phone_column_after_app_rollout.sql`: remove table-level SELECT and grant only the reviewed non-sensitive columns.
3. Keep public phone display disabled until a separately reviewed, consent-aware server-side contact path exists.
4. Keep farmer response contact details behind the existing party-scoped RLS policy.
5. Add authenticated and anonymous PostgREST integration tests proving that direct `contact_phone` selection is denied for both roles and buyer response details remain visible only to the parties. This release intentionally does not expose opted-in buyer phone values through the public board.
6. Run Supabase security advisors and staging regression tests before considering any production rollout.

## Current boundary

- No production grants, policies, migrations, or data were changed.
- No production phone values or user records were queried.
- This finding blocks release of the Buyer Demand workflow until database-level access is corrected and verified.


## Workflow integration finding

The current product has two separate demand paths:

- Farmer-facing retail/produce demand: `buyer_demands` → `buyer_demand_responses` (buyer posts; farmers express interest).
- Wholesale RFQ: `bulk_requests` → `bulk_invitations` → `bulk_quotes` / multi-item quote RPCs → buyer quote selection and fulfillment.

There is no direct relation or conversion workflow between these paths. The Farmer dashboard matching panel currently reads only `buyer_demands`; the Wholesaler dashboard matching panel reads only invitation-scoped `bulk_requests` and approved `harvest_listings`.

Do not auto-copy a farmer's interest into a wholesaler quote or silently convert a retail demand into an RFQ. They have different actors, verification, quote privacy and moderation rules. A future bridge should be an explicit buyer/admin action that creates a new RFQ with source-demand provenance, preserves the buyer as owner, requires moderation and invitation, and does not expose farmer response phone numbers to wholesalers. It needs its own authorization and idempotency tests.

## Development remediation prepared — staging validation required

- Moved phone privilege restriction to `20261128040000_restrict_buyer_demand_phone_column_after_app_rollout.sql` so it can be applied only after the updated app is live.
- The migration explicitly revokes SELECT on `contact_phone`; the updated Buyer Demand Board never requests that column, including for opted-in rows. Public phone display is disabled until a separately reviewed server-side contact-sharing path is available.
- Buyer demand discovery retains its current non-phone field contract. Farmer response contact data remains a separate table and is still fetched through its existing party-scoped RLS query.
- Static regression coverage now checks the migration's revoke/grant contract and ensures the board does not select buyer-demand phone values.
- This migration has **not** been applied to production or any staging database. The only connected Supabase project is the production project; no billable Supabase branch was created. PostgREST anonymous/authenticated integration tests and post-migration privilege verification remain release gates.
