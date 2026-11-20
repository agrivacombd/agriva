import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const migration = read("../supabase/migrations/20261120140000_marketplace_order_integrity_idempotency.sql");
const route = read("../app/api/checkout/route.ts");
const button = read("../components/marketplace/CheckoutButton.tsx");
const orderTracking = read("../components/orders/OrderTracking.tsx");

assert.ok(migration.includes("public.set_marketplace_order_status"), "latest migration must replace the effective order status RPC");
assert.ok(migration.includes("p_status='cancelled' and o.status in ('pending','processing') and o.shipped_at is null"), "only pre-shipment cancellations may restock");
assert.ok(migration.includes("A refund is financial"), "refund must not be treated as physical return");
assert.ok(migration.includes("o.status='shipped' and p_status='delivered'"), "seller cannot cancel shipped orders");
assert.ok(migration.includes("unique (buyer_id,idempotency_key)"), "Buy Now idempotency ledger must be unique per buyer/key");
assert.ok(migration.includes("pg_advisory_xact_lock"), "concurrent retries must serialize on buyer/key");
assert.ok(migration.includes("prior.shipping_address is distinct from p_shipping_address"), "reusing a key with a different request must be rejected");
assert.ok(migration.includes("finalize_marketplace_cod_order_safe("), "idempotent RPC must delegate to the existing validated COD finalizer");
assert.ok(route.includes('rpc("finalize_marketplace_cod_order_idempotent"'), "Buy Now API must call the idempotent database RPC");
assert.ok(route.includes("p_idempotency_key: idempotencyKey"), "Buy Now API must pass the idempotency key to the database");
assert.ok(button.includes("directCheckoutIdempotencyKeyRef"), "client must preserve one key across uncertain retries");
assert.ok(button.includes("idempotencyKey: directCheckoutIdempotencyKeyRef.current"), "client must submit the stable key");
assert.ok(orderTracking.includes("getExistingMarketplaceCartUser"), "order tracking must only reuse an existing guest/session identity");
console.log("Marketplace order lifecycle, Buy Now idempotency, and guest order tracking regression checks passed.");
