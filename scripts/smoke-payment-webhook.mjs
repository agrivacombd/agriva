#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/payments/webhook/route.ts", "utf8");

assert.match(route, /createHmac\(["']sha256["']/,
  "webhook must calculate an HMAC over the raw request body");
assert.match(route, /timingSafeEqual\(/,
  "signature comparison must use a constant-time comparison");
assert.match(route, /req\.headers\.get\(["']x-payment-signature["']\)/,
  "webhook must read the documented signature header");
assert.match(route, /Number\.isFinite\(amount\) && amount > 0/,
  "payment amount must be finite and positive");
assert.match(route, /validOrderId/,
  "order id must be validated before RPC invocation");
assert.match(route, /validIdempotencyKey/,
  "idempotency key must be validated before RPC invocation");
assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/,
  "database service key must remain server-only");
assert.doesNotMatch(route, /signature\s*!==\s*expected/,
  "do not compare a supplied signature directly to the shared secret");

console.log("Payment webhook HMAC validation regression checks passed.");
