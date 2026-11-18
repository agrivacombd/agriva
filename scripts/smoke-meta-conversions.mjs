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
const detailPage = read("app/marketplace/[productId]/page.tsx");
const productTracker = read("components/marketplace/ProductClickTracker.tsx");

assert.match(layout, /<MetaPixel \/>/, "MetaPixel must be mounted in the root layout");
assert.match(pixel, /NEXT_PUBLIC_META_PIXEL_ID/, "Pixel ID must be optional, never hardcoded");
assert.match(pixel, /hasMarketingConsent\(\)/, "Pixel must load only after consent");
assert.match(pixel, /agriva:consent-changed/, "Consent updates must be synchronized in same tab");
assert.match(pixel, /trackMetaEvent\("PageView"\)/, "PageView must track navigation");
assert.match(pixel, /agriva:meta-pixel-ready/, "Consent-granted Pixel readiness must notify product views");
assert.match(detailPage, /productPrice=\{hasRealPrice \? Number\(product.price\) : null\}/, "Product view needs validated current price");
assert.match(productTracker, /hasMarketingConsent\(\)/, "ViewContent must respect marketing consent");
assert.match(productTracker, /trackMetaEvent\("ViewContent"/, "Product detail view must send ViewContent");
assert.match(productTracker, /agriva:meta-pixel-ready/, "ViewContent must wait for Pixel readiness");
assert.match(productTracker, /viewContentTrackedRef.current === productId/, "ViewContent must deduplicate per product view");
assert.match(consent, /window\.dispatchEvent\(new Event\("agriva:consent-changed"\)\)/, "Consent change notification missing");
assert.match(helper, /if \(!hasMarketingConsent\(\)/, "Events must respect marketing consent");
assert.match(helper, /eventID: eventId/, "Purchase events must carry idempotent order IDs");
assert.match(direct, /trackMetaEvent\("Purchase"/, "Direct COD success must emit Purchase");
assert.match(cart, /trackMetaEvent\("Purchase"/, "Cart COD success must emit Purchase");
assert.match(direct, /if \(data\.orderId && Number\.isFinite\(orderTotal\)\)/, "Direct COD must require a saved order");
assert.match(cart, /if \(result\.orderId && Number\.isFinite\(Number\(result\.total\)\)\)/, "Cart COD must require a saved order");
assert.doesNotMatch(helper, /params\.phone|params\.email|params\.name|params\.address/, "Do not pass PII into Meta events");
console.log("Meta conversions static regression checks passed.");
