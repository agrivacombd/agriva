#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const layout = read("app/layout.tsx");
const pixel = read("components/analytics/MetaPixel.tsx");
const helper = read("lib/meta-pixel.ts");
const consent = read("components/analytics/GoogleAnalytics.tsx");
const direct = read("components/marketplace/CheckoutButton.tsx");
const cart = read("app/checkout/page.tsx");

assert.match(layout, /<MetaPixel \/>/, "MetaPixel must be mounted in the root layout");
assert.match(pixel, /NEXT_PUBLIC_META_PIXEL_ID/, "Pixel ID must be optional, never hardcoded");
assert.match(pixel, /hasMarketingConsent\(\)/, "Pixel must load only after consent");
assert.match(pixel, /agriva:consent-changed/, "Consent updates must be synchronized in same tab");
assert.match(pixel, /trackMetaEvent\("PageView"\)/, "PageView must track navigation");
assert.match(consent, /window\.dispatchEvent\(new Event\("agriva:consent-changed"\)\)/, "Consent change notification missing");
assert.match(helper, /if \(!hasMarketingConsent\(\)/, "Events must respect marketing consent");
assert.match(helper, /eventID: eventId/, "Purchase events must carry idempotent order IDs");
assert.match(direct, /trackMetaEvent\("Purchase"/, "Direct COD success must emit Purchase");
assert.match(cart, /trackMetaEvent\("Purchase"/, "Cart COD success must emit Purchase");
assert.match(direct, /const confirmedId = String\(data\.orderId \|\| ""\)/, "Direct COD must normalize the server-confirmed order ID");
assert.match(direct, /if \(confirmedId && Number\.isFinite\(orderTotal\)\)/, "Direct COD must require a saved order and finite total");
assert.match(cart, /if \(result\.orderId && Number\.isFinite\(Number\(result\.total\)\)\)/, "Cart COD must require a saved order");
assert.doesNotMatch(helper, /params\.phone|params\.email|params\.name|params\.address/, "Do not pass PII into Meta events");
console.log("Meta conversions static regression checks passed.");
