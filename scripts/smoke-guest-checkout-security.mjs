#!/usr/bin/env node
// Repository contract checks only. This is NOT a database-backed E2E test.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

const session = read("lib/marketplace/guest-checkout-session.ts");
const marketplaceButton = read("components/marketplace/CheckoutButton.tsx");
const marketplaceCart = read("app/cart/page.tsx");
const marketplaceCheckout = read("app/checkout/page.tsx");
const plantButton = read("components/plant-market/PlantMarketAddToCart.tsx");
const plantCheckout = read("components/plant-market/PlantMarketCheckoutClient.tsx");
const marketCartApi = read("app/api/checkout/cart/route.ts");
const plantCartApi = read("app/api/plant-market/cart/route.ts");
const plantOrderApi = read("app/api/plant-market/checkout/route.ts");
const marketplaceGuestSql = read("supabase/migrations/20261102161707_secure_guest_checkout_identity.sql");
const marketplaceAtomicSql = read("supabase/migrations/20261102161719_atomic_marketplace_cart_checkout.sql");
const plantAtomicSql = read("supabase/migrations/20261102161752_plant_market_checkout_and_order_lifecycle.sql");

assert.match(session, /signInAnonymously\(\)/, "Guest checkout must create an anonymous Auth identity");
assert.match(session, /auth\.getUser\(\)/, "Buyer identity must be verified by Supabase Auth");
assert.match(session, /pendingBuyer/, "Concurrent guest entry points must share one session initializer");
assert.match(session, /\.finally\(/, "Guest session initializer must release rejected attempts for retry");
for (const [name, source] of [
  ["Marketplace cart", marketplaceCart],
  ["Marketplace checkout", marketplaceCheckout],
  ["Marketplace product purchase", marketplaceButton],
  ["Plant Market add to cart", plantButton],
  ["Plant Market checkout", plantCheckout],
]) {
  assert.match(source, /ensureCheckoutBuyerSession|resolveMarketplaceCartUser/, name + " must initialize guest buyer identity");
}
for (const [name, source] of [
  ["Marketplace cart API", marketCartApi],
  ["Plant Market cart API", plantCartApi],
  ["Plant Market order API", plantOrderApi],
]) {
  assert.match(source, /auth\.getUser\(\)/, name + " must authorize with verified Auth user");
}
assert.match(marketplaceGuestSql, /new\.is_anonymous/, "New guest accounts must be distinguished from registered users");
assert.match(marketplaceGuestSql, /array\['buyer'\]::text\[\]/, "Guests must receive buyer role only");
assert.match(marketplaceGuestSql, /Anonymous accounts cannot change role memberships/, "Anonymous accounts must not self-elevate");
assert.match(marketplaceGuestSql, /require_guest_checkout_buyer_identity/, "Marketplace checkout must check guest buyer permissions");
assert.match(marketplaceAtomicSql, /marketplace_checkout_require_guest_buyer/, "Guest buyer guard must be attached to checkout insert");
for (const [name, sql] of [["Marketplace", marketplaceAtomicSql], ["Plant Market", plantAtomicSql]]) {
  assert.match(sql, /pg_advisory_xact_lock/, name + " checkout must serialize conflicting writes");
  assert.match(sql, /idempotency_key/, name + " checkout must be idempotent");
  assert.match(sql, /auth\.uid\(\)/, name + " checkout must bind rows to authenticated identity");
}
assert.match(plantAtomicSql, /plant_market_cart_owner_read/, "Plant cart needs buyer-owned RLS");
assert.match(plantAtomicSql, /plant_market_order_party_read/, "Plant order needs buyer/seller scoped RLS");
assert.match(plantAtomicSql, /seller_id=\(select auth\.uid\(\)\)/, "Plant seller order RLS must check ownership");
assert.match(plantAtomicSql, /active verified plant market seller access required/i, "Plant seller actions require verified seller access");
console.log("Guest buyer auth, role separation, cart ownership and checkout source contracts passed.");
