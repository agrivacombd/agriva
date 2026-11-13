# AGRIVA Product Page & Checkout Implementation Plan

Repository audited: `agrivacombd/agriva`  
Base branch: `main`  
Plan branch: `docs/agriva-product-checkout-implementation-plan`

## Audit findings (verified from the current default branch)

- Framework: Next.js **16.4.5**, React 18.3.1, TypeScript 5.7.3, Tailwind CSS 3.4.17.
- Router: **App Router**. The repository has `app/` routes; there is no `pages/` checkout implementation.
- Supabase: PostgreSQL via `@supabase/supabase-js` 2.57.4 and `@supabase/ssr` 0.5.2.
- Existing product detail route: `app/marketplace/[productId]/page.tsx`. It resolves both product slugs and UUIDs, redirects UUID/non-canonical paths to the slug, and already includes metadata, Product/Breadcrumb JSON-LD, a 4-image gallery, seed-specific information, product details, buyer guidance and FAQs.
- Existing marketplace listing: `app/marketplace/page.tsx` + `components/marketplace/MarketplaceCore.tsx`.
- Existing cart and checkout: `app/cart/page.tsx`, `app/checkout/page.tsx`, `app/api/checkout/cart/route.ts`, and `app/api/checkout/route.ts`.
- Existing cart checkout uses an atomic Supabase RPC, idempotency key, Bangladesh address fields, phone validation and server-side stock/price validation.
- Existing direct-buy API currently enforces COD and does not accept online payment.
- Online payment is **currently disabled**: SSLCommerz init/success/fail/cancel/IPN endpoints return HTTP 410. Existing `test:sslcommerz-payment` explicitly asserts these routes remain disabled. Do not re-enable them by removing the guard or changing the test alone.
- Existing checkout summary currently states delivery charge is calculated as **৳0**. A real delivery-zone/charge policy must be agreed before charging or displaying a non-zero amount.
- Existing product page has an “আরও পণ্য খুঁজুন” sidebar with category/all-products links, but no actual related-product card section.
- Supabase SSR helpers exist in `lib/supabase/server.ts` and `lib/supabase/client.ts`; auth refresh currently uses `middleware.ts`. Keep the existing auth/session design stable while implementing checkout. Review Next.js 16's `proxy.ts` migration separately rather than mixing it into the commerce work.

## Implementation scope and file-by-file tasks

### P0 — Baseline and contracts

1. `package.json`
   - Preserve pinned dependencies and lockfile.
   - Use existing scripts as the baseline; do not upgrade Next.js/Supabase packages as part of the UI change.
2. Existing scripts to run before changes:
   - `npm run test:cod-cart`
   - `npm run test:checkout-error-safety`
   - `npm run test:payment-webhook-hardening`
   - `npm run test:payment-webhook-disabled`
   - `npm run test:marketplace-product-image-gallery`
   - `npm run test:admin-authorization`
   - `npm run lint` and `npm run build`
3. Inspect current database migrations and RPC definitions before writing any new SQL. Reuse existing order, cart, payment-event and inventory structures where appropriate.

### P1 — Product detail UX and related products

1. `app/marketplace/[productId]/page.tsx`
   - Preserve slug/UUID canonicalization, metadata, JSON-LD, existing seed-specific content boundary, and seller-provided product facts.
   - Add a server-side related-products query after the current product is resolved.
   - Exclude the current product, deleted/inactive/unavailable listings as appropriate, and never recommend a sample product.
   - Rank same subcategory first, then same category; use a deterministic fallback to other active marketplace products only if the category has too few matches.
   - Select only fields needed for cards: `id, slug, name, price, stock, unit, image_url, category`.
   - Add the related-products section after FAQs/details and before the footer.
2. New `components/marketplace/RelatedProducts.tsx`
   - Responsive 2-column mobile / 4-column desktop card grid or horizontal carousel.
   - Show actual image, title, current price/unit, stock state and link to the canonical product slug.
   - No invented rating, discount, stock, germination or performance claims.
3. Existing `components/marketplace/ProductImageGallery.tsx`
   - Retain current lightbox and thumbnail behavior.
   - QA touch behavior, image fallback, keyboard close and layout shift; only change if tests reveal issues.
4. Existing `components/marketplace/CheckoutButton.tsx`
   - Remove the embedded full COD address form from the product detail page after confirming all entry points.
   - Provide clear quantity selector, “কার্টে যোগ করুন” and “এখনই অর্ডার করুন”.
   - “এখনই অর্ডার করুন” should use a validated server-side buy-now flow or a cart line item, not a second divergent checkout implementation.
   - Preserve login/guest-cart policy as implemented by the current database RPCs; do not silently weaken RLS.

### P1 — Cart and unified checkout UX

1. `app/cart/page.tsx`
   - Preserve existing stock/price refresh and quantity limits.
   - Add clear empty-cart state, item subtotal, delivery-charge disclosure and checkout CTA.
   - Ensure unavailable items remain visible and removable rather than silently disappearing.
2. `app/checkout/page.tsx`
   - Refactor into a mobile-first single-page checkout with customer details, Bangladesh address, delivery estimate/charge, payment selector and order summary.
   - Keep COD as the only selectable live payment option until a gateway is configured and verified.
   - Show Online Payment as “শীঘ্রই আসছে” or hide it; do not present a dead option as available.
   - Do not hardcode a non-zero delivery charge. Use an agreed server-owned delivery policy.
   - Keep the existing idempotency key across retry attempts.
3. New reusable UI components under `components/checkout/`:
   - `CheckoutCustomerForm.tsx`
   - `BangladeshAddressFields.tsx`
   - `DeliveryChargeSummary.tsx`
   - `PaymentMethodSelector.tsx`
   - `CheckoutOrderSummary.tsx`
   - `CheckoutSubmitButton.tsx`
   Use the existing `lib/bangladesh-locations.ts` dataset unless an authoritative maintained source is adopted.

### P1 — Checkout server/API integrity

1. `app/api/checkout/cart/route.ts`
   - Keep the atomic `finalize_marketplace_cart_checkout` RPC, server-side price/stock calculation, normalized phone, complete address validation and idempotency.
   - Ensure all displayed totals come from the server response.
2. `app/api/checkout/route.ts`
   - Unify direct-buy with the same order-creation contract or deprecate it in favor of a server-created buy-now cart.
   - Add idempotency to direct-buy before exposing it as a primary order path.
   - Preserve safe localized errors; never return raw database errors.
3. `app/api/checkout/cart/route.ts` and relevant Supabase RPC/migrations
   - Confirm delivery fee is computed server-side from a maintained policy.
   - Ensure order creation, inventory reservation/decrement and idempotency are atomic.
   - Verify RLS and RPC EXECUTE grants; do not use public SECURITY DEFINER functions as a shortcut.
4. New/updated tests under `scripts/`
   - Checkout total tampering rejected.
   - Insufficient stock and concurrent checkout.
   - Idempotent retry returns the same order.
   - Guest/authenticated access cannot read another buyer's order.
   - Invalid Bangladesh phone/address rejected.
   - Delivery fee cannot be overridden by client input.

### P2 — Online payment (separate gated workstream)

1. First inspect existing payment tables, event logs, order status transitions, SSLCommerz route history and disabled-payment tests.
2. Confirm with AGRIVA which gateway is contracted and live: SSLCommerz, aamarPay, bKash checkout, Nagad or another provider. Confirm merchant account approval, settlement account and test/live credentials.
3. Only after credentials and provider selection:
   - Implement server-only payment initiation.
   - Store a pending payment attempt linked to the order with a unique provider transaction ID.
   - Verify callback/IPN signatures and independently verify transaction status with the provider.
   - Make webhook processing idempotent and resistant to replay.
   - Mark an order paid only after verified provider confirmation.
   - Add failure, cancel, expiry and refund handling.
4. Update the existing disabled SSLCommerz smoke test only as part of a complete verified integration, with new tests for signature validation, amount/currency/order matching, duplicate callbacks and invalid callbacks.
5. Never expose merchant secrets or service-role credentials to the browser.

### P2 — Confirmation, order management and analytics

1. Reuse existing order history/admin order management if present; inspect before adding new pages.
2. Add/verify order confirmation view with order reference, item summary, payment status and delivery address.
3. Keep customer PII out of analytics payloads.
4. Verify Meta Pixel events: ViewContent, AddToCart, InitiateCheckout and Purchase. Define COD Purchase semantics with AGRIVA (order placed vs delivered); use browser/server event IDs for deduplication.
5. Verify analytics event is emitted only once on successful order creation/payment state transition.

## Acceptance criteria

- Product detail remains indexable with canonical slug, correct OpenGraph/Product JSON-LD and no sample listing purchasable.
- Related products are real active inventory records and never include the current product.
- Cart and checkout work at mobile widths and remain keyboard accessible.
- Customer cannot set price, stock, delivery fee, payment status or order owner from the browser.
- COD checkout works end-to-end and is idempotent.
- Online payment is not advertised as active until gateway verification is complete.
- RLS, RPC grants, webhook replay protections and admin authorization tests pass.
- `npm run lint`, relevant smoke tests and `npm run build` pass before merge.

## Decisions needed from AGRIVA before production release

1. Delivery charge policy: flat fee, district/upazila-based zones, or courier-calculated? What are the actual rates and remote-area rules?
2. Online gateway: which provider has an approved merchant account and credentials?
3. COD order confirmation: phone call/manual confirmation or automated SMS/WhatsApp?
4. Product-specific facts: final packet photos, lot/batch fields, and verified germination/purity evidence to display.

## Safety boundary

This branch contains planning documentation only. No production source code, database schema, payment credentials, payment enablement or live deployment has been changed.
