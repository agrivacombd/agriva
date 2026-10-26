#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(route, /Marketplace checkout RPC failed/, "checkout RPC failures must be logged server-side");
assert.match(route, /code: error\.code \|\| "unknown"/, "logs must use a bounded error code field");
assert.match(route, /অর্ডার সম্পন্ন করা যায়নি। পণ্য ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।/, "buyer must get a safe localized error");
assert.doesNotMatch(route, /NextResponse\.json\(\{ error: error\.message \}/, "raw database errors must not be returned to clients");

console.log("Checkout error disclosure regression checks passed.");

const checkout = readFileSync("app/checkout/page.tsx", "utf8");
assert.match(checkout, /removeError.*cartSyncFailed/s, "successful order lines must be removed from the active cart immediately");
assert.match(checkout, /Check your Orders page before retrying to avoid duplicate orders/, "interrupted checkout must warn about checking existing orders");
assert.match(checkout, /Successful orders were removed from the cart/, "partial checkout must explain how successful lines were handled");
