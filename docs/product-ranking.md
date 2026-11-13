# AGRIVA product ranking (Marketplace + Plant Market)

## How the default sort works

The **জনপ্রিয় ও সর্বাধিক বিক্রিত** default is server-ranked (Postgres, no OpenAI calls). Each market has its own product and order tables, and its own separate engagement pool. The public catalogue RPC returns only approved, active product fields.

Ranking uses a rolling **30-day** window:
- **Completed sale units:** `42 × ln(1 + delivered/completed units)`. Orders that are cancelled, refunded or failed are excluded; an order that is merely placed is **not a sale**. The Plant Market counts line-item quantities, not just order count.
- **Click-through rate:** `12 × min(1, clicks / max(impressions, 15))`, smoothing very small samples.
- **Click interest:** `5 × ln(1 + unique clicks)`.
- **Exposure:** `2 × ln(1 + unique impressions)`. Exposure has a much weaker weight than sales.
- **New listing discovery:** up to **8 points** over the first 14 days, decreasing to zero, so new listings can gather genuine interest.
- **In-stock items first**, then calculated score, publication date and product ID for deterministic ties.

Shoppers can still override ranking with **নতুন পণ্য** or price sorting. Category and subcategory URLs use the same scoring. Search filtering retains the received server order.

## Event semantics & cost

An **impression** requires >=50% of a product card to be visible. The client sends visible-card events in batches (maximum 32) to one first-party endpoint; changing filters does not repeatedly count the same card in a page session. A **listing click** comes from a product card; a **detail view** is any product detail page visit, including search engines/external sources. Only listing clicks count toward listing CTR. Each market/product/event/viewer combination can count once per UTC database day (Postgres `current_date`); visitors with Do Not Track / Global Privacy Control are skipped; known crawlers are skipped. Events are retained only as keyed, nonreversible viewer hashes: **no raw IP, browser UA, email or user ID** stored in the event table. Rank data is not a public per-user analytics API.

The server route requires `SUPABASE_SERVICE_ROLE_KEY` (server only) and `NEXT_PUBLIC_SUPABASE_URL`. No database write is allowed from `anon` or `authenticated` directly. When the key or migration is missing, tracking is unavailable, while the catalogue falls back to safe chronological reads so shopping is not blocked. Avoid using a high frequency external polling loop; regular page loads compute ranking against indexed 30-day data.

Deduplicating by a keyed IP + UA hash trades some precision for abuse resistance: visitors with the same network and browser signature can be counted as one; rotating browser signatures or IP addresses is still possible. This is a basic anti-manipulation layer, **not** a guaranteed bot detector. Add edge-level rate limiting before substantial traffic.

## Deployment checklist

1. Review and apply `supabase/migrations/20261113233000_product_behavior_rankings.sql` to the correct project's staging database, then production before merging/deploying the web application. Do not apply it to an unrelated Supabase project.
2. Verify `select * from public.get_ranked_marketplace_products(5);` and `select * from public.get_ranked_plant_market_products(5);`. Confirm inactive, private, deleted and out-of-stock rules, and that no PII is returned. Verify `has_table_privilege('anon','public.product_rank_events','select')` is false.
3. Ensure the production Vercel environment already has the server-only `SUPABASE_SERVICE_ROLE_KEY` for the **same** Supabase project. Never prefix it with `NEXT_PUBLIC_`; never log it.
4. Verify the browser Network tab shows batched `POST /api/product-rank/events` returning 204 and that repeated loads do not inflate counts. Test with DNT/GPC enabled, on mobile and desktop, with real active listings and authorized test purchases that transition through delivery/completion.
5. Install the follow-up hybrid schema migration, verify, then apply its Cron migration. Supabase Cron runs `select public.maintain_product_rank_history();` at 20:30 UTC each day, atomically aggregating before deleting raw events.
6. Monitor SQL execution times and bot volume. For large catalogues move to precomputed daily scores; do not increase list limits indefinitely.

The migration is additive; does not change checkout, payment, inventory or order status logic; and does not auto-deploy.

## Hybrid retention and corrected CTR (November 2026)

- Migration `20261114003000_product_rank_hybrid_retention.sql` creates private daily product-level counts (no visitor hash/PII), adds `listing_click` alongside the legacy direct detail-view `click`, preserves existing data, and backfills eligible completed days.
- Idempotent daily maintenance performs product/day upsert first and only then deletes raw event rows older than **35 UTC dates** (`occurred_on < current_date - 34`). It keeps aggregated rows for **365 UTC dates** (`metric_date < current_date - 364`) and the entire transaction rolls back upon failure.
- Migration `20261114004000_product_rank_daily_cron.sql` enables pg_cron and schedules the maintenance at **20:30 UTC / 02:30 Asia/Dhaka**. No Vercel function, external API, or AI calls.
- Ranking combines completed-day aggregates with today's live deduplicated raw events. Listing CTR uses attributed `listing_click` rather than direct product views, so external traffic does not inflate listing CTR. Raw impressions are no longer a positive score on their own; completed sales remain the leading boost.
- Marketplace sales use delivery time (`delivered_at`), then `updated_at` and `created_at` fallbacks. Plant Market currently lacks a delivery timestamp and uses `updated_at` fallback.
- Keep both metrics and raw events inaccessible to `anon` and `authenticated`. Only a whitelisted public ranking RPC returns catalog-safe fields. An optional admin-only analytics dashboard can be added later without changing retention.
- Verify scheduled job status in `cron.job` and run history in `cron.job_run_details`. Check RPC item counts and private grants after applying migrations. Cron day boundaries are UTC.
