#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(route, /Marketplace checkout RPC failed/, "checkout RPC failures must be logged server-side");
assert.match(route, /code: error\.code \|\| "unknown"/, "logs must use a bounded error code field");
assert.match(route, /অর্ডার সম্পন্ন করা যায়নি। পণ্য ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।/, "buyer must get a safe localized error");
assert.doesNotMatch(route, /NextResponse\.json\(\{ error: error\.message \}/, "raw database errors must not be returned to clients");

console.log("Checkout error disclosure regression checks passed.");
