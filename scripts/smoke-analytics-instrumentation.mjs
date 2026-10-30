#!/usr/bin/env node
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const layout = readFileSync("app/layout.tsx", "utf8");
const analytics = readFileSync("components/analytics/GoogleAnalytics.tsx", "utf8");
const helper = readFileSync("lib/analytics.ts", "utf8");
const sellerForm = readFileSync("components/seller/SellerProductForm.tsx", "utf8");
const checkout = readFileSync("components/marketplace/CheckoutButton.tsx", "utf8");

assert.match(layout, /GoogleAnalytics/, "Root layout must load the optional GA4 integration");
assert.match(analytics, /NEXT_PUBLIC_GA_MEASUREMENT_ID/, "GA4 must be configured through a public measurement ID");
assert.match(analytics, /anonymize_ip:\s*true/, "GA4 configuration must request IP anonymization");
assert.match(analytics, /send_page_view:\s*false/, "GA4 must disable automatic page views so App Router navigation can be measured once");
assert.match(analytics, /usePathname/, "GA4 must observe App Router path changes");
assert.match(analytics, /page_view/, "GA4 must emit page views for client-side navigation");
assert.match(analytics, /!\/^G-\[A-Z0-9\]\+\$\//, "Invalid measurement IDs must not load analytics");
assert.match(helper, /seller_product_submitted/, "Analytics helper must define the seller submission event");
assert.match(helper, /marketplace_order_placed/, "Analytics helper must define the order placement event");
assert.match(helper, /Never pass names, phone numbers, addresses, email addresses/, "Analytics helper must document PII exclusion");
assert.match(sellerForm, /trackAnalyticsEvent\("seller_product_submitted"/, "Successful seller submissions must emit an event");
assert.match(checkout, /trackAnalyticsEvent\("marketplace_order_placed"/, "Successful order placement must emit an event");
assert.doesNotMatch(sellerForm, /trackAnalyticsEvent\([^\n]*(?:phone|email|address|fullName)/i, "Seller events must not send personal data");
assert.doesNotMatch(checkout, /trackAnalyticsEvent\([^\n]*(?:phone|email|address|fullName)/i, "Order events must not send personal data");

console.log("Analytics instrumentation regression checks passed.");
