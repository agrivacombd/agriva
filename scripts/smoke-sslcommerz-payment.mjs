#!/usr/bin/env node

/**
 * COD-only contract: every legacy SSLCommerz entry point must be inert.
 * These static checks are not a substitute for a browser checkout test.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const paths = [
  "app/api/payment/sslcommerz/init/route.ts",
  "app/api/payment/sslcommerz/success/route.ts",
  "app/api/payment/sslcommerz/fail/route.ts",
  "app/api/payment/sslcommerz/cancel/route.ts",
  "app/api/payment/sslcommerz/ipn/route.ts",
];

for (const path of paths) {
  const source = readFileSync(path, "utf8");
  assert.match(source, /status:\s*410/, `${path} must permanently reject the retired online-payment endpoint`);
  assert.match(source, /Online payments are disabled/, `${path} must clearly explain the COD-only policy`);
  assert.doesNotMatch(source, /createSupabaseServerClient|SSLCOMMERZ_|record_payment_event|payment_status:\s*"paid"|fetch\(/,
    `${path} must not access credentials, the database or the gateway`);
}

assert.match(readFileSync("app/api/checkout/route.ts", "utf8"), /paymentMethod\s*!==\s*"cod"|payment_method:\s*"cod"/,
  "checkout must continue to enforce COD on the server");

console.log("COD-only SSLCommerz route shutdown regression checks passed.");
