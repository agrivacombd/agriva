#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/payments/webhook/route.ts", "utf8");

assert.match(route, /status:\s*503/, "unverified payment webhook must fail closed");
assert.match(route, /Online payment webhooks are not enabled/, "response must explain the endpoint is disabled");
assert.doesNotMatch(route, /record_payment_event/, "disabled endpoint must not write payment events");
assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/, "disabled endpoint must not initialize service-role access");
assert.doesNotMatch(route, /timingSafeEqual|createHmac|validSecret/, "generic signature checks must not imply provider verification");

console.log("Payment webhook fails closed until a provider-specific integration is verified.");
