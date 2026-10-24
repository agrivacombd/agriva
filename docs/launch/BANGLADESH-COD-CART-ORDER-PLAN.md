# AGRIVA Bangladesh COD Cart, Checkout & Order Operations Plan

## Decision and release boundary
- Bangladesh-first retail checkout; Cash on Delivery (COD) only.
- No online payment gateway, payment callback, production deployment, production migration, or merge in this work.
- Keep all changes in a draft PR. Validate against a disposable/staging database and authenticated test accounts before any release.
- The current schema has one marketplace_orders row per product. Until a proper parent order / order-items migration is designed and tested, do not claim multi-item checkout is one atomic order. Prefer one clearly disclosed order per product or hold multi-item checkout behind a safe gate.

## Phase A — Read-only discovery (complete before schema/code changes)
1. Inventory current cart tables/RPCs, order schema and status constraints, checkout route, admin order page, customer order tracking, settings, migrations, RLS policies, and draft PR dependencies.
2. Identify order creation RPC guarantees: stock lock/decrement, price from DB, address validation, payment_method forced to cod, idempotency/duplicate submission behavior, and rollback on partial failure.
3. Reconcile migration filenames/order and determine the existing schema only from repository migrations and a disposable DB; never infer production schema state.
4. Write the exact status/payment state machine and field requirements before implementation.

## Phase B — Customer cart and Bangladesh delivery form
- Cart: show product image/name, unit price, quantity, stock availability, subtotal, remove/update quantity, empty-cart state, and clear errors.
- Checkout: Bangla-first labels, BDT (৳), Cash on Delivery only, no card/online-payment controls.
- Required recipient details: recipient full name, mobile number, division, district, upazila/thana, union/area, village/road/house/holding or building/floor, landmark (optional), postal code (optional where practical), delivery instructions (optional).
- Phone validation should accept Bangladesh local forms (+8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX) and normalize consistently; never reject valid numbers only due to spaces/dashes.
- Show order summary, quantity, delivery charge policy, total payable on delivery, stock and COD availability. Never trust client-sent price/total.
- Preserve form values on validation failure; prevent double-click duplicate submission; show a confirmation with order reference after successful creation.
- Do not require sign-in for guest COD checkout unless the actual schema/RLS design requires it. If guest orders are not safely supported, explicitly retain sign-in and communicate it instead of bypassing authorization.

## Phase C — Admin order desk
- Add an admin-only order queue with quick filters: New/Pending, Processing, Shipped, Out for delivery (only if schema supports it), Delivered, Cancelled, Failed delivery/Return.
- Each order detail must show order reference, created time, product and quantity, item price, delivery fee, total COD due, recipient phone, full Bangladesh address, instructions, payment method/status, fulfilment timeline, and notes.
- Add status transitions using server-side authorized database RPCs; reject invalid transitions and audit actor, timestamp, previous/new state, and reason where supported.
- Keep fulfilment status distinct from COD collection/payment status. Delivered does not automatically mean cash collected; only authorized collection confirmation may mark COD collected/paid, with actor/time and amount recorded.
- Support cancellation/restock exactly once; failed delivery/return must not duplicate restock or commission reversal.
- Keep search/filter/pagination usable on mobile; never expose one buyer's address to other buyers/sellers without authorization.

## Phase D — Data integrity and security
- Prefer a parent orders table + order_items for one checkout containing multiple products, with a single transaction and shared delivery address. Do not implement sequential per-item checkout that can create partial orders without clearly telling the buyer.
- Database-side validation of active product, stock, price, COD policy, address, status transitions, and admin authorization.
- RLS on exposed tables; narrow grants; SECURITY DEFINER functions only when justified, with fixed search_path, explicit auth/admin checks and limited EXECUTE grants.
- Idempotency token/order request key to stop accidental duplicate orders.
- Atomic stock reservation/decrement, transaction-safe cancellation/restock, immutable order price snapshots, and audit log.
- Do not expose service-role secrets in client code. Do not invent test products/orders in production.

## Phase E — Tests and release gates
- Unit/smoke tests for Bangladesh phone normalization, required address validation, price/total calculation, COD-only enforcement and state transition rules.
- Disposable DB migration replay from empty state; migration order and RLS/grants verification.
- Authenticated browser tests: add/update/remove cart item, invalid/valid phone, missing address, stock race, double-submit, failed checkout, successful COD order, order visibility, admin-only status update, non-admin denial, cancel/restock once, and COD collection audit.
- Test mobile widths and Bangla rendering.
- Confirm GitHub CI and the correct Vercel preview; determine whether legacy Netlify preview failures are relevant or obsolete.
- Only after explicit user approval may a reviewed PR be merged, staging schema be applied, or production migration/deployment be scheduled.

## Implementation order
1. Finish Phase A and document confirmed schema limitations.
2. Make the customer form/cart truthful and safer without assuming missing columns.
3. Implement order parent/items and COD collection audit only after migration design is reconciled and tested.
4. Build admin queue/detail/status actions against the finalized state machine.
5. Run full tests and present evidence + rollout/rollback plan for approval.
