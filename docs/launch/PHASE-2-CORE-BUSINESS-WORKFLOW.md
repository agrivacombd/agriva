# Phase 2 — Core Business Workflow

## Scope
- COD remains the only supported checkout payment method.
- Retain #180's Upazila requirement; require division, district, upazila/thana, union/area and village/road/house.
- Port #28 cart/atomic checkout and #39 Bangladesh form onto current main, not their stale branches.
- Extend #38 admin delivery desk with a separate COD collection audit.

## Integrity and security
- Add-to-cart locks the live product, reads its current price/stock in PostgreSQL and updates the authenticated user's active cart.
- Cart checkout creates one parent checkout and product fulfilment rows in one PostgreSQL transaction. All cart lines/products are locked and validated before order creation.
- Buyer-scoped idempotency keys are serialized with an advisory transaction lock; retries return the existing checkout.
- Bangladesh phone numbers normalize to +8801XXXXXXXXX; address fields persist structurally with a legacy printable address.
- Cart access is owner-scoped and cart-item writes are blocked after conversion.
- Admin collection events record expected amount, current collection, cumulative collection, discrepancy, actor, timestamp and note. Delivery status never implies cash collection.

## Release gates
- Run npm run test:cod-cart, lint and build.
- Replay migrations from empty state in a disposable Supabase database; verify RLS isolation, rollback, stock contention, idempotency, admin-only collection and cumulative discrepancy math.
- Run authenticated preview tests with disposable users/products.
- No production migration, merge or deployment in this draft.
