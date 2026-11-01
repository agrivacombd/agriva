#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(route, /Marketplace checkout RPC failed/, "checkout RPC failures must be logged server-side");
assert.match(route, /code: error\.code \|\| "unknown"/, "logs must use a bounded error code field");
assert.match(route, /অর্ডার সম্পন্ন করা যায়নি। পণ্য ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।/, "buyer must get a safe localized error");
assert.doesNotMatch(route, /NextResponse\.json\(\{ error: error\.message \}/, "raw database errors must not be returned to clients");

const checkout = readFileSync("app/checkout/page.tsx", "utf8");
const cartApi = readFileSync("app/api/checkout/cart/route.ts", "utf8");
assert.match(checkout, /crypto\.randomUUID/, "atomic checkout must keep an idempotency key across retries");
assert.match(checkout, /idempotencyKeyRef/, "checkout retries must reuse the same idempotency key");
assert.match(cartApi, /finalize_marketplace_cart_checkout/, "multi-item checkout must use the single atomic database RPC");
assert.match(cartApi, /p_idempotency_key/, "the server must send the idempotency key to the atomic RPC");
assert.doesNotMatch(checkout, /Successful orders were removed from the cart/, "atomic checkout must not report partial item success");

console.log("Checkout error disclosure and atomic retry regression checks passed.");
