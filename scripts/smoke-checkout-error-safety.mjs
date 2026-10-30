#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(route, /Marketplace checkout RPC failed/, "legacy checkout RPC failures must be logged server-side");
assert.match(route, /code: error\\.code \\|\\| "unknown"/, "legacy logs must use a bounded error code field");
assert.match(route, /অর্ডার সম্পন্ন করা যায়নি। পণ্য ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।/, "legacy buyer must get a safe localized error");
assert.doesNotMatch(route, /NextResponse\\.json\\(\\{ error: error\\.message \\}/, "raw database errors must not be returned to clients");

const cartRoute = readFileSync("app/api/checkout/cart/route.ts", "utf8");
assert.match(cartRoute, /Checkout RPC failed/, "COD cart checkout failures must be logged server-side");
assert.match(cartRoute, /code: error\\.code/, "COD checkout logs must expose only a bounded error code and message");
assert.match(cartRoute, /অর্ডার তৈরি করা যায়নি। আপনার কার্ট যাচাই করে আবার চেষ্টা করুন।/, "COD buyer must receive a safe localized fallback");
assert.doesNotMatch(cartRoute, /NextResponse\\.json\\(\\{ error: error\\.message \\}/, "raw database errors must not be returned by COD checkout");

const checkout = readFileSync("app/checkout/page.tsx", "utf8");
assert.match(checkout, /fetch\\("\/api\/checkout\/cart"/, "checkout must use the server-validated COD cart endpoint");
assert.match(checkout, /idempotencyKeyRef\\.current/, "checkout retries must reuse a buyer-scoped idempotency key");
assert.match(checkout, /if \\(!response\\.ok\\) throw new Error\\(result\\.error/, "checkout must surface safe server errors instead of treating failed responses as success");
assert.match(checkout, /catch \\(error\\)/, "checkout must handle network and server failures");
assert.match(checkout, /setMessage\\(error instanceof Error \\? error\\.message/, "checkout must show a bounded user-facing error message");

console.log("Checkout error disclosure and COD cart regression checks passed.");
