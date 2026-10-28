#!/usr/bin/env node

/**
 * Static regression checks for the SSLCommerz routes. These checks do not
 * replace sandbox integration tests or exercise a live database/gateway.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const ipn = readFileSync("app/api/payment/sslcommerz/ipn/route.ts", "utf8");
const init = readFileSync("app/api/payment/sslcommerz/init/route.ts", "utf8");
const reconciliation = readFileSync("supabase/migrations/20261029180000_atomic_sslcommerz_reconciliation.sql", "utf8");

assert.match(ipn, /validated\?\.tran_id\s*!==\s*tranId/, "IPN must bind validated transaction ID");
assert.match(ipn, /validated\?\.currency[\s\S]*BDT/, "IPN must require BDT currency");
assert.match(ipn, /\["VALID",\s*"VALIDATED"\]/, "IPN must accept only validated gateway states");
assert.match(ipn, /createSupabaseServiceRoleClient/, "unauthenticated provider callback must use a server-only trusted database client");
assert.match(ipn, /reconcile_sslcommerz_payment/, "IPN must use the atomic payment reconciliation RPC");
assert.doesNotMatch(ipn, /createSupabaseServerClient/, "IPN must not depend on a browser session for provider callbacks");
assert.doesNotMatch(ipn, /\.from\("marketplace_orders"\)[\s\S]*?\.update\(/, "IPN must not directly mutate payment state outside the atomic RPC");
assert.match(ipn, /if\s*\(error\)/, "IPN must check database reconciliation errors");
assert.match(reconciliation, /auth\.role\(\) IS DISTINCT FROM 'service_role'/, "payment reconciliation RPC must be restricted to service-role callers");
assert.match(reconciliation, /FOR UPDATE/, "payment reconciliation must lock the order row");
assert.match(reconciliation, /round\(p_amount, 2\) <> round\(v_order\.total_amount, 2\)/, "database must verify the canonical order amount");
assert.match(reconciliation, /ON CONFLICT \(idempotency_key\) DO NOTHING/, "payment transaction ledger writes must be idempotent");
assert.match(reconciliation, /ON CONFLICT \(event_key\) DO NOTHING/, "order payment events must be idempotent");
assert.match(init, /if\s*\(authError\s*\|\|\s*!user\)/, "init must reject unauthenticated callers");
assert.match(init, /order\.buyer_id\s*!==\s*user\.id/, "init must require exact order ownership");
assert.match(init, /order\.payment_method\s*!==\s*"online"/, "init must reject non-online orders");
assert.match(init, /order\.payment_status\s*!==\s*"pending"/, "init must reject non-pending payments");
assert.match(init, /if\s*\(referenceError\)/, "init must check payment-reference write errors");
assert.match(init, /AbortSignal\.timeout\(15_000\)/, "payment init must time-bound the provider request");
assert.match(init, /gatewayUrl\.protocol !== "https:"/, "payment init must reject non-HTTPS gateway URLs");
assert.match(init, /hostname\.endsWith\("\.sslcommerz\.com"\)/, "payment init must restrict redirects to SSLCommerz-owned hosts");
assert.match(init, /\.select\("id"\)\.maybeSingle\(\)/, "payment init must confirm the conditional reference update matched a still-payable order");
assert.match(init, /if\s*\(!referencedOrder\)[\s\S]*?status:\s*409/, "payment init must reject an order that became unpayable during gateway initialization");

console.log("SSLCommerz payment route regression checks passed.");

const success = readFileSync("app/api/payment/sslcommerz/success/route.ts", "utf8");
const failure = readFileSync("app/api/payment/sslcommerz/fail/route.ts", "utf8");
const tracking = readFileSync("components/orders/OrderTracking.tsx", "utf8");
assert.match(success, /payment", "pending"/, "browser success redirect must not claim verified payment");
assert.match(success, /new URL\("\/orders"/, "success return must use the existing orders route");
assert.match(success, /Only the validated IPN updates payment_status/, "only IPN may confirm payment");
assert.match(failure, /new URL\("\/orders"/, "failure return must use the existing orders route");
assert.match(tracking, /payment_status/, "order tracking must show database payment status");
assert.match(tracking, /redirect দেখে পেমেন্ট সফল ধরে নেবেন না/, "order tracking must explain redirects are not proof of payment");

const cancel = readFileSync("app/api/payment/sslcommerz/cancel/route.ts", "utf8");
assert.match(cancel, /new URL\("\/orders"/, "cancel return must use the existing orders route");
assert.match(cancel, /payment", "cancelled"/, "cancel return must clearly indicate cancellation");
assert.match(tracking, /returnedPayment === "cancelled"/, "orders page must explain cancelled payment returns");
