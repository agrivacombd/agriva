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

An **impression** requires >=50% of a product card to be visible. The client sends visible-card events in batches (maximum 32) to one first-party endpoint; changing filters does not repeatedly count the same card in a page session. A **click** is an actual product-detail page visit, including from other sources. Each market/product/event/viewer combination can count once per UTC database day (Postgres `current_date`); visitors with Do Not Track / Global Privacy Control are skipped; known crawlers are skipped. Events are retained only as keyed, nonreversible viewer hashes: **no raw IP, browser UA, email or user ID** stored in the event table. Rank data is not a public per-user analytics API.

The server route requires `SUPABASE_SERVICE_ROLE_KEY` (server only) and `NEXT_PUBLIC_SUPABASE_URL`. No database write is allowed from `anon` or `authenticated` directly. When the key or migration is missing, tracking is unavailable, while the catalogue falls back to safe chronological reads so shopping is not blocked. Avoid using a high frequency external polling loop; regular page loads compute ranking against indexed 30-day data.

Deduplicating by a keyed IP + UA hash trades some precision for abuse resistance: visitors with the same network and browser signature can be counted as one; rotating browser signatures or IP addresses is still possible. This is a basic anti-manipulation layer, **not** a guaranteed bot detector. Add edge-level rate limiting before substantial traffic.

## Deployment checklist

1. Review and apply `supabase/migrations/20261113233000_product_behavior_rankings.sql` to the correct project's staging database, then production before merging/deploying the web application. Do not apply it to an unrelated Supabase project.
2. Verify `select * from public.get_ranked_marketplace_products(5);` and `select * from public.get_ranked_plant_market_products(5);`. Confirm inactive, private, deleted and out-of-stock rules, and that no PII is returned. Verify `has_table_privilege('anon','public.product_rank_events','select')` is false.
3. Ensure the production Vercel environment already has the server-only `SUPABASE_SERVICE_ROLE_KEY` for the **same** Supabase project. Never prefix it with `NEXT_PUBLIC_`; never log it.
4. Verify the browser Network tab shows batched `POST /api/product-rank/events` returning 204 and that repeated loads do not inflate counts. Test with DNT/GPC enabled, on mobile and desktop, with real active listings and authorized test purchases that transition through delivery/completion.
5. Configure **Supabase Cron** (when available) to run `select public.prune_product_rank_events();` daily. The RPC removes events older than 35 days and is callable only from a privileged connection. If Cron is not enabled, run this maintenance from a trusted daily job; do not expose it in a public API.
6. Monitor SQL execution times and bot volume. For large catalogues move to precomputed daily scores; do not increase list limits indefinitely.

The migration is additive; does not change checkout, payment, inventory or order status logic; and does not auto-deploy.
