# Buyer Demand → Wholesaler RFQ conversion design

## Status
Development implementation only. The review UI and authenticated conversion endpoint call a development-only RPC migration. No migration has been applied to any database; no production data write or notification has occurred.

## Existing workflow boundaries
- Farmer-facing demand board uses `buyer_demands` and `buyer_demand_responses`.
- Wholesaler quotations use `bulk_requests`, `bulk_invitations`, `bulk_quotes`, and verified `bulk_wholesalers`.
- These are separate workflows with different response and authorization models. A farmer response is not a wholesaler quote and must never be copied into `bulk_quotes`.

## Safe conversion contract
A future buyer-initiated conversion must:
1. Require an authenticated buyer and verify `buyer_demands.buyer_id = auth.uid()` server-side.
2. Require the source demand to be `active`; reject expired response deadlines.
3. Show a review screen before conversion. Never silently publish free-text `notes`, personal phone numbers, or farmer response details.
4. Ask the buyer to confirm `buyer_type` (individual/business), RFQ visibility (public/private), and quote deadline. These fields are not safely inferable from the current demand record.
5. Map only reviewed fields: `crop_name → product_name`, `quantity`, `unit`, `district`, `upazila`; `need_date` can prefill `desired_date` only for `specific_date`. Urgent/date-range/flexible modes need buyer confirmation rather than guessed dates.
6. Do not silently map `target_price`: `bulk_requests` has no equivalent target-price field in the current schema. Keep it visible in the review step and leave it out unless the RFQ schema is deliberately extended.
7. Use a transactional, idempotent server-side operation with a source-demand unique key so retries cannot create duplicate RFQs.
8. Keep invitation creation restricted to verified wholesalers and preserve the existing invitation-only quote submission and competitor quote isolation.
9. Record an immutable audit event linking the source demand and created RFQ, without copying private contact data.
10. Notify only through an existing supported notification pipeline after the transaction commits; do not create a second notification channel.

## Remaining requirements before production enablement
- Decide whether the source demand remains active, is marked fulfilled, or gains a distinct converted state. Do not mark it fulfilled merely because an RFQ was created.
- Add a dedicated conversion-link table or equivalent durable source reference with a unique constraint and strict RLS; do not overload notes/specification with IDs.
- Run the migration and verify the server-side transaction/RPC with owner, active/deadline, idempotency and validation tests in isolated staging.
- Add synthetic integration tests for owner mismatch, inactive/expired demand, duplicate retry, invalid buyer type/visibility, date mapping, private visibility, verified wholesaler invitation and quote isolation.
- Verify all access through anonymous/authenticated PostgREST in an isolated staging database before release.

## Known schema facts from read-only metadata inspection
- `buyer_demands` has buyer owner, crop, quantity/unit, district/upazila, need mode/dates, optional target price, free-text notes and private contact phone.
- `bulk_requests` requires buyer owner, buyer type, visibility, status, product name, specification, quantity/unit, district/upazila; desired date and quote deadline are optional.
- `bulk_invitations` is unique per request/wholesaler and references auth users.
- `bulk_quotes` is unique per request/wholesaler and requires invitation-governed participation in the existing workflow.
- `bulk_wholesalers` supports pending/verified/suspended status; conversion must not bypass verification.

## Phase 1 implemented — safe draft mapping
- Added a pure, side-effect-free RFQ draft mapper with explicit buyer type, visibility and quote-deadline choices.
- It rejects inactive/expired demands and invalid RFQ field values.
- It maps only crop, quantity/unit, district/upazila and a specific need date; all other need modes require a date to be selected separately.
- It deliberately excludes notes, phone, target price and farmer responses from the resulting draft.
- Synthetic regression tests cover the allowed mapping and privacy boundaries.
- This is a preparation layer only: it does not create a bulk request, invite wholesalers, mutate demand status, or send notifications. The transactional RPC and isolated staging verification remain release gates.

## Phase 2 implemented — transactional conversion boundary (development only)
- Added `buyer_demand_rfq_conversions` with unique source-demand and RFQ references, restrictive foreign keys, RLS enabled, and no client table grants.
- Added immutable conversion-link records and `convert_buyer_demand_to_bulk_rfq(...)`, a SECURITY DEFINER transaction with pinned search_path, authenticated owner check, row lock, active/deadline validation, explicit buyer type/visibility/deadline validation, and a 90-day quote-deadline ceiling.
- The RPC creates the RFQ in `pending_review`; it does not auto-publish, invite wholesalers, create quotes, alter source demand status, or send notifications.
- Retries for an already converted owned demand return the same RFQ ID. The source row lock and unique constraints prevent concurrent duplicate conversion.
- Only crop, quantity/unit, district/upazila, and a specific need date are copied. Phone, public-phone flag, notes, target price, farmer responses, invitations, and quotes are excluded.
- Added static migration-contract regression checks to both CI workflows. These checks are not a substitute for running the migration and PostgREST/RLS integration tests against isolated staging.
- Migration is committed to the development branch only and has not been applied to production or any database.

## Security release gate
The Buyer Demand phone-column migration is development-only. It has not been applied to the connected production project. Public phone display is disabled in the UI pending a safe, reviewed contact-sharing design. Staging privilege and PostgREST verification are still required.


## Phase 3 implemented — buyer review UI and authenticated API (development only)
- Added a conversion review panel to the buyer's own active demand cards. It requires explicit buyer type, visibility, quote deadline and a final consent checkbox; visibility defaults to private.
- Shows exactly which demand fields are copied and clarifies that only a specific requested date is carried over. Urgent, range and flexible dates are not guessed.
- Added same-origin, JSON-only, bounded-request API route using the authenticated Supabase server session. It validates the demand UUID and choices, enforces a future deadline within 90 days, then calls the transactional RPC; it does not use a service-role client.
- The RPC remains the authorization authority: it verifies ownership, active status and source deadline, and returns the same RFQ ID on retries.
- The new RFQ is pending review. The original demand remains active. No invitation, quote, publication or notification is created.
- Added UI/API static regression coverage to repository CI and the targeted bulk-RFQ workflow.
- This phase is not staging-verified. The database migration remains unapplied; the UI/API should not be enabled on production until the migration and authenticated/anonymous PostgREST tests pass in isolated staging.
