# AGRIVA Route-to-Permission Matrix — Phase A working register

**Branch:** `feat/super-admin-audit-dashboard`  
**Architecture reference:** AGRIVA Platform Architecture: Roles, Access, and Connected Workflows  
**Status:** Initial API-handler pass. This matrix is intentionally explicit about unverified database enforcement; a handler-level check does not replace RPC/RLS/Storage enforcement.

| Route | Intended capability / access rule | Current observed enforcement | Gap / next verification |
| --- | --- | --- | --- |
| `POST /api/admin/article/generate` | `content.draft` | Authenticated user + legacy `profiles.role === admin`; writes draft with creator ID | Replace scattered role check with capability helper; inspect draft table RLS and audit trail |
| `POST /api/admin/content-brief` | `content.draft` | Authenticated user + legacy admin profile check; returns template | Capability helper; rate/abuse limits if exposed beyond trusted staff |
| `POST /api/admin/content-drafts/generate` | `content.draft` | Authenticated user + legacy admin profile check; approved opportunity required; uses draft RPC | Capability helper; validate RPC grants, audit, slug collision behavior |
| `GET/PATCH /api/admin/content-opportunities` | `content.review` / `content.publish` by transition | Legacy admin profile check; validates allowed transitions and compare-and-set update | Capability enforcement; atomic transition + audit event; ensure only approved content can publish |
| `POST /api/admin/products` | `catalog.create_platform` | Authenticated user + legacy admin profile check; validates fields and calls admin RPC | Capability helper; ensure image upload ownership, RPC grant, and audit |
| `POST /api/ai` | Public agriculture Q&A; no private data | Public endpoint; bounds question length; safe error response | Add rate limiting/abuse controls and ensure provider secrets remain server-side |
| `POST /api/checkout` | Authenticated buyer; `orders.create_own` (permission identifier to add/reconcile) | Authenticated user; server COD setting check; order creation through database RPC; client does not supply authoritative total | Confirm RPC computes price/stock and buyer ID from auth subject, idempotency, order-event and commission atomicity |
| `GET/POST /api/crop-disease` | Authenticated own history/media | Auth required; history filtered by `user_id`; upload path starts with authenticated user ID; image MIME/signature/size checked | Verify Storage policies and RLS; enforce per-user rate/retention and cleanup failed uploads |
| `POST /api/farmer/products` | `catalog.create_own` + seller/farmer role | Shared capability helper, seller/farmer membership check, owner ID from auth subject, commission fixed to zero | Verify edit/resubmit/media path and DB policies on staging |
| `GET /api/health` | Public minimal liveness/readiness | Uses anon key; returns coarse dependency status only | Ensure no secret/config disclosure; decide whether public readiness is appropriate |
| `POST /api/payment/sslcommerz/init` | Authenticated buyer, own payable order | Authenticated user; exact buyer ID; online/pending state; server-calculated stored amount | Verify rate limiting, pending reference concurrency, gateway response validation and sandbox journey |
| `POST /api/payment/sslcommerz/ipn` | Provider callback; server-only trusted reconciliation | Provider val_id is verified against SSLCommerz; now calls service-role-only atomic RPC | Requires server-only `SUPABASE_SERVICE_ROLE_KEY`; validate SQL migration on staging and run real sandbox duplicate/race tests |
| `GET/POST /api/payment/sslcommerz/success` | Public return URL; never proof of payment | Redirects to orders with pending state; does not write payment | Verify return URL host handling and UX |
| `GET/POST /api/payment/sslcommerz/fail` | Public return URL; never trusted payment state | Redirect only | Verify UX and ensure no client-side state mutation |
| `GET/POST /api/payment/sslcommerz/cancel` | Public return URL; never trusted payment state | Redirect only | Verify UX and ensure no client-side state mutation |
| `POST /api/payments/webhook` | Disabled until provider-specific verification exists | Intentionally inert; returns 503 | Keep disabled until signature, replay, canonical amount, idempotency and provider-specific reconciliation are reviewed |
| `POST /api/reseller/links` | Reseller's own referral links | Authenticated user + legacy profile role check; UUID validation; creation RPC | Reconcile membership-based roles; verify RPC checks reseller role and active approved product |
| `POST /api/search` | Public search; public catalog only | Bounded input; product results now require active + approved; AI answer may continue if product lookup fails | Rate limiting; verify production schema migration before enabling catalog results |
| `GET /api/search` (if introduced) | No route found in baseline | Not present in current inventory | Keep absent unless deliberately implemented |

## Cross-cutting findings

1. The two server permission helpers duplicate profile/membership lookup and differ in failure status. Pick one canonical helper after call-site mapping; fail closed on every lookup error.
2. Five admin content/catalog handlers still rely on `profiles.role === admin` rather than capability identifiers. This can exclude Super Admin/multi-role grants and fragments policy. Migrate only with regression tests.
3. Checkout permission namespace lacks a dedicated `orders.create_own` identifier; reconcile the canonical permission list before using it.
4. Payment IPN must not use a cookie-bound anon client: provider callbacks do not carry a buyer session. It now uses a service-role-only RPC after remote provider validation. Service-role secret must remain server-only.
5. Public search previously selected active products without checking moderation state. It now requires both `status=active` and `moderation_status=approved`; if the migration is absent, product search fails closed rather than exposing unreviewed listings.
6. Public AI/search endpoints need abuse/rate-limit review. A maximum input length alone is not a rate limit.
7. This is not yet the complete inventory: server actions, RPCs, RLS policies, Storage buckets, and every page route still need mapping.

## Tests and release gates

- Static route checks are added to `scripts/smoke-sslcommerz-payment.mjs` and `scripts/smoke-taxonomy.mjs`.
- Static checks are not a substitute for live Supabase RLS tests or SSLCommerz sandbox integration.
- Run lint, type-check, all smoke scripts, regression suite and production build in CI.
- Validate all migrations against a staging database before production; no migration from this PR should be applied to production as part of this inventory pass.
