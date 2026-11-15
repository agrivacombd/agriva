#!/usr/bin/env node
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const layout = readFileSync("app/layout.tsx", "utf8");
const analytics = readFileSync("components/analytics/GoogleAnalytics.tsx", "utf8");
const helper = readFileSync("lib/analytics.ts", "utf8");
const privacy = readFileSync("app/privacy-policy/page.tsx", "utf8");
const terms = readFileSync("app/terms-of-service/page.tsx", "utf8");
const cookies = readFileSync("app/cookie-policy/page.tsx", "utf8");
const home = readFileSync("app/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");

assert.match(layout, /GoogleAnalytics/, "Root layout must load the optional GA4 integration");
assert.match(analytics, /NEXT_PUBLIC_GA_MEASUREMENT_ID/, "GA4 must be configured through a public measurement ID");
assert.match(analytics, /anonymize_ip:\s*true/, "GA4 configuration must request IP anonymization");
assert.match(analytics, /send_page_view:\s*false/, "GA4 must disable automatic page views so App Router navigation can be measured once");
assert.match(analytics, /usePathname/, "GA4 must observe App Router path changes");
assert.match(analytics, /page_view/, "GA4 must emit page views for client-side navigation");
assert.match(analytics, /validMeasurementId = Boolean\(measurementId && \/\^G-\[A-Z0-9\]\+\$\//, "Invalid measurement IDs must not load analytics");
assert.match(helper, /seller_product_submitted/, "Analytics helper must define the seller submission event");
assert.match(helper, /marketplace_order_placed/, "Analytics helper must define the order placement event");
assert.match(helper, /Never pass names, phone numbers, addresses, email addresses/, "Analytics helper must document PII exclusion");


assert.match(analytics, /consentChecked/, "Consent UI must wait until the saved preference has been read");
assert.match(analytics, /const showBanner = consentChecked && consent === null/, "Returning visitors must not see the consent banner while preferences hydrate");
assert.match(analytics, /addEventListener\("storage", syncConsent\)/, "Consent choices must stay in sync across browser tabs");
assert.match(analytics, /window\.gtag\('consent', 'default', \{[\s\S]*?analytics_storage: 'denied'/, "Consent Mode v2 must default to denied");
assert.match(analytics, /window\.gtag\('consent', 'update', \{[\s\S]*?analytics_storage: 'granted'/, "Consent Mode v2 must update to granted after opt-in");
assert.match(analytics, /ad_user_data: 'denied'/, "Consent Mode v2 must default ad_user_data to denied");
assert.match(analytics, /ad_personalization: 'denied'/, "Consent Mode v2 must default ad personalization to denied");
assert.match(analytics, /consent\?\.marketing, ready/, "Consent update must react to changed marketing permission");
assert.match(analytics, /hasAnalyticsConsent\(\)/, "Page views must respect the current analytics consent");
assert.match(helper, /if \(!hasAnalyticsConsent\(\)/, "Custom analytics events must stop after consent is revoked");
assert.match(privacy, /Google Analytics 4/, "Privacy Policy must explain GA4");
assert.match(privacy, /Meta Pixel/, "Privacy Policy must explain marketing measurement");
assert.match(privacy, /Plant Market/, "Privacy Policy must reflect the separate Plant Market");
assert.match(privacy, /১৫ নভেম্বর ২০২৬/, "Privacy Policy must carry the current effective date");
assert.match(terms, /Cash on Delivery \\(COD\\)/, "Terms must explain the actual COD checkout");
assert.match(terms, /ক্রেতার চাহিদা/, "Terms must cover peer-to-peer demand postings");
assert.match(cookies, /Basic Consent Mode v2/, "Cookie Policy must explain the active consent model");
assert.match(cookies, /agriva_privacy_consent_v1/, "Cookie Policy must document saved visitor choices");
assert.match(home, /href="\\/cookie-policy"/, "Homepage footer must link to Cookie Policy");
assert.match(analytics, /href="\\/cookie-policy"/, "Consent banner must link to Cookie Policy");
assert.match(sitemap, /\\/cookie-policy/, "Sitemap must include the cookie policy route");
assert.doesNotMatch(privacy, /প্রকাশের আগে বাস্তবে/, "Do not leave legacy draft-only notice on live privacy page");
assert.doesNotMatch(terms, /প্রকাশের আগে এই খসড়াটি/, "Do not leave legacy draft-only notice on live terms");
console.log("Analytics instrumentation regression checks passed.");
