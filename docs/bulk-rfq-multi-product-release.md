# AGRIVA Multiple Product Custom Order — Release Checklist

## Delivered on feature/bulk-rfq-multi-item
- Buyer: one order with 1–20 item entries (name, quantity, unit, optional specification), add/remove on mobile.
- The existing single-item request flow remains supported; new single-item requests use the multi-item schema too.
- Account: repeat an existing custom order with its complete item list, editable as a new request; old request remains unchanged.
- Wholesale: admin shareable per-request invitation URL, restricted to logged-in invited verified wholesalers.
- Supplier quotation: choose which lines you can supply, enter independent unit price, shipping charge and other fees; one supplier quote can cover a subset of requested items.
- Buyer quotation comparison: compare approved, unexpired offers per item, sorted by estimated delivered cost; independently choose wholesalers for each line.
- Admin: review request line items and quote-line prices, approve/reject a supplier quote, track each selected line through fulfillment statuses.
- Supplier: track individual awarded products after invitation expiry.
- Public board: shows the first item and number of additional products, not private specifications or contact information.
- Database: additive tables bulk_request_items, bulk_item_offers, bulk_item_awards; RLS and locked SECURITY DEFINER RPC transactions.

## Staging validation (agriva-editorial-staging)
- Applied three additive migrations: multi-item base, public item count, awarded supplier access.
- Rollback-wrapped SQL scenario passed: two items, supplier lines, admin approval, first selection keeps request open, second selection finishes request, independent fulfillment change.
- Duplicate selection denied; other-request item quoting denied; unrelated authenticated user cannot see private request items/quotes or select an award.
- Non-admin fulfillment mutation denied; all new privileged RPCs inaccessible to anon.
- Supabase advisor: no ERROR lint for new tables.

## Release gates
- GitHub PR CI lint, TypeScript and regression suite success on *latest* commit.
- Confirm protected preview linked to staging and test in browser with buyer, supplier and admin sessions.
- Vercel quota reported API-deployment-free-per-day exceeded on November 17 2026. No new build/deployment available until account quota is resolved/reset.
- Production has not received these migrations; do NOT merge before production DB release plan and build verification.
- Manual quote invitations are still required; payments, delivery carrier integration, automated notifications, split shipment fees and invoicing are outside current scope.
