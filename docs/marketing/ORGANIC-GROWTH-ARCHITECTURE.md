# AGRIVA Zero-Budget Organic Growth Architecture
Audit date: 2026-11-15. Source of truth: agrivacombd/agriva main and publicly discoverable AGRIVA webpages. This document is a marketing plan, not evidence that every runtime integration has been tested.

## Positioning
AGRIVA — কৃষকের হিসাব, কৃষি জ্ঞান, ফসলের পরিকল্পনা ও কেনাবেচা এক জায়গায়।
Audience: Bangladesh field crop/vegetable growers first; then agricultural students, agri-input buyers/sellers and farm employers. Avoid rooftop-gardening messaging in farmer campaigns.

## Verified inventory / promotion gate
- P0 promotion: /land-calculator, /seed-rate-calculator, /farming-cost-profit-calculator, /crop-choice, /agriculture-calculators, /tools, /learn, /marketplace, /sell-harvest.
- P1: /fertilizer-calculator only with user-supplied/local-approved rates; /tools/irrigation-water-calculator and /tools/harvest-date-calculator as estimates; /market-prices is a gateway to authoritative sources, NOT a live AGRIVA price feed.
- Conditional: /ai can fall back without a configured provider; /crop-disease requires login and image analysis configuration. Do not promise diagnosis. /jobs currently exposes zero jobs; /buyer-demands showed an unavailable list; /sell-harvest showed zero public listings. Encourage first listing rather than implying a populated market.
- Do not promote registry entries status=prototype, including the symptom-guide, diary prototype and market-price notebook.
- Product category inventory seen on 2026-11-15: 26 total Marketplace products, 25 seeds, 1 premium food/grain; other category inventory counts zero. Do not imply fertilizers, machines or plant marketplace items are in stock without rechecking.

## Code audit: actionable findings
1. lib/tools/registry.ts lists active / login-required / prototype statuses. Use this list as the publishing eligibility gate.
2. /seed-rate-calculator is a Bengali tool using user-supplied seed rates. /tools/seed-rate-calculator has English labels and illustrative crop reference rates; do not present example values as agronomic recommendations. Prefer former for beginner farmer posts.
3. /farming-cost-profit-calculator is the Bengali crop profit path. /tools/farm-cost-calculator serves unit-cost calculations. Avoid competing campaigns to semantically similar URLs.
4. /market-prices links to market.dam.gov.bd and ais.gov.bd rather than serving validated live prices.
5. The blog aggregates Supabase published CMS articles and bundled articles. Require claim-by-claim source review, actual working slug, image and social preview before marketing an individual article.
6. Existing app/robots.ts, app/sitemap.ts, metadata and OG tags form an SEO baseline; validate production indexing, schema, canonical and social sharing cards. Presence in code is not a verified live performance result.
7. GA4 and Meta Pixel use env configuration and consent; settings DB is not automatically the runtime env. For zero-budget organic tracking prefer Search Console, GA4 with consent, and simple UTM links; no ads needed.
8. Current StandaloneCalculator offers a return link to calculator hub but not a tailored product CTA; add low-pressure related guide and product links after core task, never before results.
9. Pages that are draft, broken or empty must be excluded from automated posting.

## Organic acquisition architecture
Facebook Page original post/reel + moderation-compliant farmer group answers + YouTube Shorts -> ONE deep, accessible AGRIVA feature URL -> answer/help/tool use -> related learning article and marketplace link -> trust / follow -> repeat visits.
Google queries -> indexed unique Bengali guide or tool -> directly useful answer and calculator -> related educational guide -> product / sell-harvest option.
No dark patterns, forced follows, engagement bait, mass posting or fabricated farmer testimonials.

## Four content pillars, weekly cadence
- 40% practical farmer problems and validated field tips.
- 30% tool walkthroughs (authentic screen recordings, voiceover and examples).
- 20% farmer questions, community, marketplace/sell-harvest enablement.
- 10% specific stocked product discovery, with latest price/stock check.
Four main posts and two original reels per week; an original blog guide weekly where research is available. Reuse concept, not identical spammed caption.
Each asset: hook (first line) -> 2-4 real benefits/instructions -> single feature URL -> natural question for the audience. Caption 80-140 Bengali words in long-form, shorter versions for Shorts, no unsupported statistics or claims.
Social creatives: original phone screen recordings and genuine packets/fields with permission; vertical 1080x1920 for reels, 1080x1350 for portrait post. Add clear AGRIVA branding subtly; no artificially invented testimonials, field results or screenshots.

## Attribution and measurement
Use campaign-safe organic UTM example: ?utm_source=facebook&utm_medium=organic_social&utm_campaign=seed_calculator&utm_content=reel01
Keep canonical clean. Do not vary query strings unnecessarily; for Facebook groups prefer clean helpful links. Metrics per week: posted unique assets, qualified referral sessions, engaged sessions, tool starts/completions if instrumented, product page visits, confirmed orders, returning users, Search Console organic clicks and impressions. Do not invent counts. If tracking is disabled by consent, report only aggregate permitted server-side totals without personal data.
Proposed opt-in event naming: tool_open, tool_result_view, related_guide_click, related_product_click; never send raw farm inputs, identifiable location, symptom image or customer details.

## Recommendations to implement later (NOT INCLUDED IN THIS DOC-ONLY PR)
- Content link manifest keyed by tool id, public URL, SEO topic, review date, status, source links and CTA type.
- /admin/marketing/content-calendar: status [idea -> fact_check -> approved -> scheduled -> published -> measured], assets, CTA, UTM, reviewer, updated_at; publishing manually first.
- Tool detail pages: contextual next-step guides, relevant live product recommendations and privacy-safe sharing. Prevent paid AI exposure through uncontrolled promotion.
- Automated weekly report generated from GA4/GSC if connected; no external publishing or billing actions without authorizations.
- Fix Buyer Demand list error and verify runtime before paid/organic growth campaign.
- Merge/clarify overlapping calculator search intent and Bengali localization; keep stable URLs or redirect carefully after SEO impact review.

## Publish QA gate
[ ] Opening exact URL works on mobile
[ ] Tool result or target task successfully verified in a real browser
[ ] No unsupported claim, false price, promised result or inaccurate label
[ ] Photo rights, crop data and references checked
[ ] Feature availability/login/consent disclosed where applicable
[ ] One relevant link and meaningful question
[ ] Link preview image and Bengali title checked
[ ] Tracking is consent-compliant
[ ] No repeated copy-paste across groups
[ ] After 7 days, inspect engagement and referral sessions

## Source map
Repository: https://github.com/agrivacombd/agriva
Live pages: https://agriva.com.bd/ , https://agriva.com.bd/tools , https://agriva.com.bd/marketplace , https://agriva.com.bd/sell-harvest , https://agriva.com.bd/jobs , https://agriva.com.bd/buyer-demands , https://agriva.com.bd/market-prices
Search: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
Original Facebook content: https://about.fb.com/news/2026/03/rewarding-original-creators-on-facebook/
