# AGRIVA Bulk RFQ: B2B + B2C implementation blueprint

Status: implementation specification (not live). Keep existing marketplace checkout and Buyer Demands unchanged until the workflow is tested in staging.

## Product decisions
- Public discovery, controlled quotation: an RFQ is `public` by default after admin moderation; buyer may choose `private`. Public RFQs reveal product, standardized quantity, coarse location (district/upazila) and deadline only.
- B2B and B2C share one request model, with `buyer_type` = business|individual; company details and VAT/TIN optional and never publicly exposed.
- Verified wholesalers may request access to a public RFQ; admins may also invite by account-specific, expiring links. An invitation is never authentication.
- Every wholesaler independently submits an offer; other wholesalers cannot access competitors' offers, bid counts or private buyer data.
- Buyer compares only approved, currently valid offers. Sort by **landed cost** (line item price + transport + disclosed fees) before unit price; compare delivery window, available quantity, payment terms and verified status.
- A quote acceptance is an intention to purchase, not instant payment/order placement. Server must atomically reserve/select one quote and initiate verification/confirmation. No payment integration in Phase 1.
- Price and supplier claims should never be marked verified without evidence. Do not display fake ratings, inventory or delivery estimates.

## Buyer journey
1. Landing `/custom-order`: product selector/search (or free text), quantity + unit, quality/specification, desired date, delivery district/upazila, optional target budget and attachment.
2. Contact: authenticated user or phone verification; consent to quotation access and publication visibility. Request saved as pending_review; provide random nonenumerable request reference.
3. Admin reviews and publishes public details or sends private invites.
4. Buyer receives notification about approved offers and views `/account/custom-orders/[id]`.
5. Buyer selects an approved quote, with explicit full cost, quote expiry and availability confirmation. Order created only upon verified fulfillment conditions.
6. Cancellation, dispute, quote expiry and audit trail available.

## Wholesaler journey
- `/wholesaler/requests`: only eligible RFQs, without buyer PII.
- `/wholesaler/quotes/[requestId]`: authenticated, verified wholesaler submits quantity, unit price, tax/fees, shipping estimate, dispatch/arrival timeline, stock proof, optional photos, terms and expiry.
- Cannot quote their own RFQ; may update own pending quote before cut-off; no competitor quote access.
- Invitation token: cryptographically random, stored hashed, scoped to request + wholesaler, expiring/revocable, with server-side auth check.
- Rate limits, anti-abuse, server-generated prices and timestamps; sanitize text/attachments.

## Admin
- `/admin/custom-orders`: review, publish/hide, invite/revoke, compare internal bids, approve/reject quotes, moderate wholesaler verification, manage disputes, audit log.
- Use existing admin permissions, do not grant client-side access through UI checks alone.
- All outbound links should be canonical absolute URLs with no embedded PII.

## Proposed database (new additive migration only)
- `bulk_requests` (id uuid, buyer_id, buyer_type, visibility, status, delivery district/upazila, desired_date, created_at)
- `bulk_request_items` (request_id, product_id nullable, product_name, specifications jsonb, quantity numeric, normalized_base_unit)
- `bulk_invitations` (request_id, wholesaler_id, token_hash, expires_at, revoked_at, status)
- `bulk_quotes` (request_id, wholesaler_id, status, currency BDT, shipping_fee, other_fees, lead_days, expires_at, submitted_at, revision)
- `bulk_quote_items` (quote_id, request_item_id, quoted_quantity, unit_price)
- `bulk_quote_selections` (request_id unique, quote_id, accepted_by, accepted_at, state)
- `bulk_request_events` (actor_id, event_type, request_id, metadata, timestamp)
- `bulk_request_attachments` (storage path, owner, request/quote id, verification state)
- Denormalize only a privacy-safe public listing view; do not expose underlying request/quotes tables.

## Security gates before migrations and production
1. Confirm actual existing profiles, roles, admin permission service, order/checkout schema, delivery rules and migration naming.
2. Enable RLS on every new table and REVOKE broad grants. Buyers see own requests and approved quotes on their requests; wholesalers see only eligible request summaries + own bids; admins via existing capability checks. Avoid public direct-table reads.
3. Protect RPC mutations with authenticated actor checks, authorization in the database, explicit validation, idempotency keys and transaction locking on quote selection.
4. Verify no phone, full address, quote content or token leakage in public responses/SSR, notifications or logs.
5. Test 401 anonymous writes, 403 cross-user reads, competitor quote isolation, expiry, revoked invites, price tampering, repeat accept concurrency, moderation visibility, deleted users and uploads.
6. Stage first and validate DB migration rollback and feature flag. Do not merge/deploy until tests pass.

## Delivery phases
- P1: anonymous read-only landing/public RFQ summaries, buyer authenticated create, admin moderation/manual invites, quote submit, buyer compare/accept, basic notifications.
- P2: multi-item quotes, supplier verification UX, recurring order, quote revision, partial fulfillment, commissions and payments only after explicit policy.
- P3: matching, wholesale analytics, smart pricing suggestions without exposing competitor rates.

## Acceptance criteria
- 360px viewport usable, accessible labels and keyboard operation, Bangla-first copy.
- No quote visible to competing wholesaler, verified by real authenticated HTTP+RLS tests.
- Totals computed in BDT minor-safe decimal on server (not floating point).
- Quantity units canonicalized (maund conversion configurable and clearly labeled; never assume all local maunds equal).
- Existing buyer-demands and checkout behavior unaffected.
- All notification links route to authenticated / authorized surfaces.
