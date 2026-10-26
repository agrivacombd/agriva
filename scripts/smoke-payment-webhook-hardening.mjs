#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/payments/webhook/route.ts", "utf8");
assert.match(route, /timingSafeEqual/, "shared-secret comparison must use timing-safe equality");
assert.match(route, /MAX_BODY_BYTES/, "request body must be size-bounded");
assert.match(route, /UUID_PATTERN\.test\(orderId\)/, "order ID must be validated as UUID");
assert.match(route, /Number\.isFinite\(amount\)/, "amount must be finite");
assert.match(route, /Payment webhook RPC failed/, "database errors must be logged server-side");
assert.match(route, /Unable to process payment event/, "database errors must return a generic response");
assert.doesNotMatch(route, /error: error\.message/, "database error detail must not be returned to webhook caller");
console.log("Payment webhook hardening regression checks passed.");
