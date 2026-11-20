# AGRIVA Bangladesh COD Cart, Checkout & Order Operations Plan

## Goal
Ship a simple, mobile-first Bangladesh retail purchase journey: product detail/listing → add to cart → review cart → address/contact form → COD confirmation → order tracking. Admin staff can find, filter, and update orders without confusing order fulfilment with payment collection.

## Current-state findings (read-only audit)
- Main has a single-product checkout endpoint with server-side COD-only enforcement and a basic admin order list.
- The current checkout UI loops through cart items and calls the single-item endpoint one at a time. If a later item fails, earlier orders may already exist. This must be replaced by the atomic multi-item checkout path in draft PR #28, after its migration and transaction logic are reviewed and tested.
- Draft PR #28 introduces cart ownership policies and atomic cart checkout, but explicitly has not been migrated/deployed; build and real COD checkout are still unverified.
- Draft PR #22 introduces product entry/images/SEO but is stacked on another branch and depends on a migration. It needs dependency/schema and admin authorization review before release.
- Main admin orders page is read-only and only displays up to 100 orders. It does not offer practical status filters, status transitions, delivery details, or collection confirmation.
- Main checkout form currently collects name, phone, full address, district/city and area/upazila; it lacks a structured Bangladesh address flow and order review suitable for delivery operations.
- Online payment remains out of scope. COD only.

## Phase A — Data contract and migration review (no production writes)
1. Reconcile all existing migrations and draft PRs before adding another order schema. Avoid duplicate carts, parent checkout, fulfilment orders, status columns or storage policies.
2. Define one clear model for customer-facing checkout and the actual fulfilment order(s), including item snapshots, quantity, unit price, subtotal, delivery charge, discount (only if configured), grand total, COD amount due, payment status, delivery status, timestamps, and actor/audit fields.
3. Keep payment and fulfilment separate: order placed ≠ delivered ≠ COD cash collected. COD collection needs who/when/amount and discrepancy notes; no callback may mark COD orders paid.
4. Define a state machine and allowed transitions, with invalid transitions rejected server-side:
   - Pending / New (অর্ডার এসেছে)
   - Confirmed (নিশ্চিত)
   - Processing / Preparing (প্রস্তুত হচ্ছে)
   - Shipped / Dispatched (কুরিয়ারে/পরিবহনে)
   - Out for delivery (ডেলিভারির পথে)
   - Delivered (ডেলিভারি সম্পন্ন)
   - Cancelled (বাতিল)
   - Delivery failed / Return-to-sender (ডেলিভারি ব্যর্থ / ফেরত)
   Payment collection is separate: Due → Collected; discrepancy/refund states only where required and audited.
5. Decide whether admin staff need role separation (order manager vs super admin) based on existing role model; initially respect existing server-side admin checks, least privilege, and audit every state change.

## Phase B — Cart and Bangladesh checkout
1. Add-to-cart on listing/detail; sign-in behavior should be clear. Do not trust client price/stock; re-read and lock live product/stock in the database transaction.
2. Cart supports quantity increment/decrement, remove, availability/stock warning, current price, item subtotal, subtotal and clear COD summary.
3. Bangladesh address form:
   - Recipient full name (required)
   - Mobile number (required; accept 01XXXXXXXXX and +8801XXXXXXXXX; normalize/validate server-side)
   - Alternative contact (optional)
   - Division → District → Upazila/Thana → Union/Ward/Area (requiredness depends on delivery coverage; at minimum district and detailed address required)
   - Village/road/house/holding/landmark (detailed address required)
   - Postcode (optional)
   - Delivery instructions (optional; length-limited)
   - Order note (optional; length-limited)
   - Show items, quantities, product subtotal, delivery charge and final payable-on-delivery amount before placing order.
4. Delivery charge: do not invent a flat fee. Admin-configured delivery rules must show the exact fee before confirmation; if no valid rule exists, clearly state “delivery fee will be confirmed by support” or block checkout according to business decision—never hide an unknown charge.
5. Customer must receive a durable order reference and clear confirmation page. Order tracking should show only the signed-in user's orders and customer-safe status history.

## Phase C — Admin order desk
1. Replace the read-only list with a responsive order desk: searchable order ID/phone/recipient, status filters, date filters, COD due/collected filters, item count, total and destination.
2. Order detail view: customer/contact, full Bangladesh address, delivery instructions, items and immutable price snapshots, subtotal/charge/discount/total, COD amount due, fulfilment history, payment collection history and attribution/commission info where applicable.
3. Status dropdown/actions follow the state machine, show confirmation for risky actions, record actor, timestamp and optional note. Never allow browser/client to set arbitrary status directly.
4. Delivery assignment/tracking reference and courier fields are optional until the business has a real courier workflow; do not pretend courier integration exists.
5. COD reconciliation view: delivered-but-uncollected, collected amount vs expected amount, collection actor/time, exceptions and export. Marking delivered must not auto-mark collected.

## Phase D — Verification gates
- SQL migrations replay from a clean disposable DB and reconcile with actual schema; RLS, grants, functions, indexes, status transition checks, and audit writes reviewed.
- CI: lint, typecheck, unit/smoke tests, production build.
- Automated tests: unauthenticated checkout denied; online payment forged in request rejected; another user's cart/orders inaccessible; invalid Bangladesh phone/address rejected; price/stock tampering rejected; concurrent stock checkout cannot oversell; repeated submit does not duplicate orders; one bad item rolls back whole cart; invalid status transition rejected; delivery does not auto-collect COD; admin/non-admin authorization enforced.
- Staging walkthrough on test accounts with real test product and no production data changes.
- Production migration/deployment only after the user explicitly approves the change/test summary.

## Non-goals for this release
- Online payment gateway, automatic SMS/WhatsApp without a configured provider, unverified courier integrations, invented shipping fees, fabricated product/customer/order data.
- No merge, production migration, or production deployment without explicit approval.
