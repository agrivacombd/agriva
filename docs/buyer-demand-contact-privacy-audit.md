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
- The UI requests a number separately only for rows whose `contact_phone_public` opt-in flag is true.
- The buyer-owned query retains the existing full demand shape until the database contract is changed.
- A regression test protects this client-side data minimization.

**This is not a complete security fix.** Direct API reads remain possible until database privileges are corrected.

## Required database remediation before release

1. In a development/staging database, remove table-level SELECT from `anon` and `authenticated` on `buyer_demands`.
2. Grant only the required non-sensitive columns to public/authenticated discovery clients; do not grant `contact_phone` directly.
3. Preserve explicitly public phone sharing only through a narrowly scoped, reviewed data path that returns rows where `contact_phone_public = true` and the demand is active and not expired. If that cannot be safely implemented, disable public phone display.
4. Keep farmer response contact details behind the existing party-scoped RLS policy.
5. Add authenticated and anonymous PostgREST integration tests proving that direct `contact_phone` selection is denied, opted-in public contact retrieval is limited to opted-in rows, and buyer response details remain visible only to the parties.
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
