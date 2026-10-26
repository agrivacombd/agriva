#!/usr/bin/env node

/**
 * Static regression checks for the SSLCommerz routes. These checks do not
 * replace sandbox integration tests or exercise a live database/gateway.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const ipn = readFileSync("app/api/payment/sslcommerz/ipn/route.ts", "utf8");
const init = readFileSync("app/api/payment/sslcommerz/init/route.ts", "utf8");

assert.match(ipn, /validated\?\.tran_id\s*!==\s*tranId/, "IPN must bind validated transaction ID");
assert.match(ipn, /validated\?\.amount[\s\S]*order\.total_amount/, "IPN must compare validated amount with order amount");
assert.match(ipn, /validated\?\.currency[\s\S]*BDT/, "IPN must require BDT currency");
assert.match(ipn, /\["VALID",\s*"VALIDATED"\]/, "IPN must accept only validated gateway states");
assert.match(ipn, /payment_status:\s*"paid"/, "IPN must update payment_status");
assert.doesNotMatch(ipn, /update\(\{\s*status:\s*"paid"/, "IPN must not overwrite fulfillment status");
assert.match(ipn, /if\s*\(updateError\)/, "IPN must check database update errors");
assert.match(ipn, /duplicate:\s*true/, "IPN must handle duplicate notifications idempotently");
assert.match(init, /if\s*\(authError\s*\|\|\s*!user\)/, "init must reject unauthenticated callers");
assert.match(init, /order\.buyer_id\s*!==\s*user\.id/, "init must require exact order ownership");
assert.match(init, /order\.payment_method\s*!==\s*"online"/, "init must reject non-online orders");
assert.match(init, /order\.payment_status\s*!==\s*"pending"/, "init must reject non-pending payments");
assert.match(init, /if\s*\(referenceError\)/, "init must check payment-reference write errors");

console.log("SSLCommerz payment route regression checks passed.");
