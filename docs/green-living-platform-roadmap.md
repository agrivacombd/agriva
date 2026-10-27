# AGRIVA Green Living platform plan

## Product direction

Treat Plant Market, Green Exchange, Personal Garden, and Green Impact as one Green Living ecosystem with shared navigation, a consistent responsive design system, explicit privacy boundaries, and trustworthy data. Smart Plant & Crop Assistant remains the existing plant/crop advice entry point; Personal Garden should link to it instead of building a duplicate assistant.

## Current implementation in this change

- Personal Garden: authenticated user-owned plant list and care-task planner. Plant and task records are protected with Supabase RLS. Dates are in-app planning only; do not describe them as push/email reminders until a notification pipeline is implemented.
- Green Impact: public aggregate metrics for active/approved Green Exchange listings, active plant-related marketplace products, and requests explicitly marked completed. An aggregate-only RPC avoids exposing IDs, user details, addresses, or private messages. A missing RPC shows unavailable, never a fabricated zero.
- Navigation: links between Green Living, Plant Market, Green Exchange, Personal Garden, and Green Impact; dashboard quick access.
- SEO: public /impact is canonical and in sitemap/robots; /garden requires authentication, is noindex, and is disallowed in robots. Sitemap must never include personal garden records.
- CI: smoke tests cover RLS, ownership-safe references, aggregate-only metrics, robots/sitemap rules, and dashboard entry points.

## Recommended product roadmap

### P0 — trust, privacy, and reliability
1. Run the migration through the reviewed Supabase migration workflow and verify production RLS policies.
2. Keep all user-owned garden data behind authenticated queries and RLS. Never use a service-role key in browser code.
3. Add report/appeal flows for exchange listings, duplicate/scam moderation, clear listing states, and auditable moderator actions.
4. Add seller/nursery verification only after identity/business checks and a clear re-verification policy exist. A badge must mean something documented; never infer verification from account age or a phone field alone.
5. Add end-to-end tests for auth, garden ownership isolation, listing moderation, exchange-request transitions, and mobile flows.

### P1 — trusted Plant Market
- Search by plant name, category, price range, availability, delivery/pickup, district, and seller.
- Product detail: multiple optimized images with alt text, botanical/common name when known, pot/plant size, condition, stock timestamp, care notes, seller identity/status, delivery terms, return/refund policy, and clear enquiry/order CTA.
- Seller profile: public display name, service area at district/upazila granularity, approved listings, response expectations, and verified status with verification scope/date.
- Trust UX: report listing, block suspicious contact requests, rate only completed transactions, prevent duplicate reviews, and disclose sponsored placements.
- Never show private address or direct contact information in public structured data. Do not invent stock, ratings, shipping promises, or seller verification.

### P1 — Green Exchange 2.0
- Listing types: plant swap, cutting/seed, gift, and gardening items; condition, quantity, preferred exchange, district/area, pickup/delivery constraints, and last-updated date.
- Lifecycle: pending moderation → approved/active → request pending → accepted/countered/declined → completed/cancelled. Use server-side/RPC transition checks rather than letting clients directly edit protected status fields.
- Safety: private messaging/request details visible only to participants, no public home address, rate limits, report/block tools, clear handover checklist, and a dispute/report path.
- Add completion confirmation from both participants before counting a handover as verified impact. Until then, label metrics as platform-reported status, not independently verified real-world outcomes.

### P2 — Personal Garden
- Current base: add plants, set plant type/location label, create dated care tasks, and mark tasks complete.
- Next: plant photos and growth timeline, care activity log, repeat-task generation, snooze/reschedule, optional email/push reminders with consent and quiet hours, timezone-safe scheduling, and export/delete controls.
- Care advice should be species- and context-aware. A calendar is a reminder to inspect the plant, not a universal instruction to water/fertilize on a fixed schedule.
- Make notifications opt-in, deduplicated, and easy to disable. Do not claim notifications work until the delivery worker/provider is configured and monitored.

### P2 — Impact & Trust dashboard
- Separate counts into precise definitions: active approved exchange listings, active plant-related catalogue items, completed exchange requests, verified sellers (only after a real verification program), and participant-confirmed handovers (only after implementing confirmation).
- Add a date range and trend chart only when events/history are stored; current counts alone cannot produce trustworthy historical trends.
- If claiming trees planted, survival rates, plastic saved, or CO₂ avoided, collect auditable evidence and document the methodology first. Do not derive environmental impact from listings or exchanges alone.
- Keep public metrics aggregate-only; rate-limit the endpoint and monitor usage.

## Database design principles

- garden_plants: owner, plant name/type, optional nickname/location label, acquired date, notes, photo reference, active state, timestamps.
- garden_care_tasks: owner + plant reference, task type/title, due date, completion timestamp, optional recurrence interval.
- garden_activity_logs (planned for UI integration): owner + plant reference, event type, note/photo, happened-at timestamp.
- Existing green_exchange_listings and green_exchange_requests remain the source of exchange activity; avoid duplicating them into a second listing model.
- Product/seller verification should extend the existing product/seller model only after its current ownership and moderation structure has been audited.
- Use UUID keys, foreign keys, check constraints, indexes for owner/date and public listing queries, UTC timestamps, least-privilege grants, RLS, and explicit RPC execute grants. Keep migrations additive and forward-only; test from a clean database and against a staging project before production.

## SEO and structured data

- Public, indexable routes: /green-living, /plant-market, /green-exchange, approved public listing/product detail pages, and /impact.
- Private routes: /garden, account dashboards, request inboxes, admin/moderation pages; authenticate them, set noindex, keep them out of the sitemap, and use robots disallow as a crawl hint (not as access control).
- Unique Bengali-first title, helpful non-duplicated description, canonical URL, Open Graph, real page copy, descriptive internal links, breadcrumb UI/JSON-LD, and a valid XML sitemap for public pages.
- Use Product structured data only on individual product detail pages and only for visible, current price/availability/merchant information. Use Offer only when the offer is real. Use Organization/WebSite globally, WebPage/BreadcrumbList where appropriate, and Article only for real editorial content. Avoid fake ratings, fake reviews, or FAQ schema solely to chase rich results.
- Avoid indexable thin search/filter URLs. Canonicalize duplicate variants, ensure pagination is crawlable where needed, and do not expose private user data in schema or HTML.
- SEO rankings cannot be guaranteed; measure impressions/clicks/index coverage through Google Search Console and improve helpful content, internal links, Core Web Vitals, image delivery, and crawl health over time.

## UX and accessibility acceptance criteria

- Mobile-first at 320px width; no horizontal overflow; tap targets around 44px or larger; visible focus; semantic headings/forms; labels and errors connected to inputs; keyboard-accessible controls; readable contrast.
- Desktop: constrained content width, consistent grids, sticky or persistent navigation only when it does not hide content.
- Every data mutation has loading, success, and failure feedback; destructive actions require confirmation; empty/error/loading states are designed.
- Images use responsive sizing, modern formats, explicit dimensions, and meaningful alt text. Respect reduced motion and do not rely on color alone for status.
- Bangla is the default user-facing language with clear English product terms where useful. Avoid placeholder metrics and fake testimonials.

## Release sequence

1. Preview deploy + CI (lint, TypeScript, smoke tests, production build).
2. Apply migration to staging; test ownership/RLS and aggregate RPC as anon, user A, user B, and admin.
3. Test keyboard and mobile viewport, verify metadata/robots/sitemap, and run a Lighthouse/PageSpeed pass.
4. Apply the reviewed migration to production, then release the application. Verify runtime logs and the key routes.
5. Track activation: first plant added, first care task completed, exchange request created/completed, plant-market product enquiry, and return visits. Use privacy-conscious analytics and define retention before collection.
