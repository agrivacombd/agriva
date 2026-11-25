# Production release readiness — AGRIVA

> **Release state: HOLD.** This document is an operational gate, not approval to deploy.
> No production database migration, domain promotion, or merge is authorized by this checklist.

## Verified in the current release work

- The complete AGRIVA SQL migration chain replays successfully against a disposable local Supabase stack in GitHub Actions.
- Marketplace database tests and the full-schema seller-organization runtime tests passed in AGRIVA CI run [#3534](https://github.com/agrivacombd/agriva/actions/runs/44764971445).
- Green Living PostgreSQL integration passed in run [#44](https://github.com/agrivacombd/agriva/actions/runs/44764970785).
- The current application/runtime release head `51be02aadd203ea444193de9b55921301067e1d0` passed AGRIVA CI [#3536](https://github.com/agrivacombd/agriva/actions/runs/44766233663), including Node 24 lint, TypeScript, the full regression suite, and production build. The Vercel install command also uses lockfile-enforcing `npm ci`.
- Latest PR head `6ecdb922692525dda4ee9b07caf2433d50fe0f75` passed AGRIVA CI [#3539](https://github.com/agrivacombd/agriva/actions/runs/44768974363) and Green Living PostgreSQL integration [#49](https://github.com/agrivacombd/agriva/actions/runs/44768974399). The CI-only Supabase local database port was moved from 54322 to 54323 after a runner port collision; the full migration replay and seller-organization runtime test passed on the corrected workflow.
- The production Vercel project is `agriva-p8g6`. Its verified production domains are `agriva.com.bd` and `www.agriva.com.bd` (the latter redirects to the apex).
- The current production deployment still points to `main` commit `504f3bc835e96a0d126f044f91e5b92ae7954a3e`; the PR branch has not been deployed to production.
- The exact PR head `fd82967db59c1b49dd897b04f65f00395e66d8c0` now has a Ready Vercel preview at [agriva-p8g6-git-fix-audit-recommendations-2026-11-20-agriva1.vercel.app](https://agriva-p8g6-git-fix-audit-recommendations-2026-11-20-agriva1.vercel.app) and a Netlify preview at [deploy-preview-362--agrivaai.netlify.app](https://deploy-preview-362--agrivaai.netlify.app). Netlify's latest one-path Lighthouse result is Performance 71, Accessibility 96, Best Practices 83, SEO 100, PWA 90. This supersedes the earlier one-path Performance 52 result, but is still not a multi-route audit or a release pass; performance and Best Practices require further work.
- Production Supabase project was explicitly confirmed by the owner: `supabase-coral-clock` (`dhqaepsbuwhbynagfxpf`), ACTIVE_HEALTHY, PostgreSQL 17. The production database migration history currently ends at `20261120090537_marketplace_order_integrity`.
- Read-only production data checks found 2 verified organizations; 1 is the owner of all 27 Marketplace products and all 25 Marketplace orders. All 27/27 products and 25/25 orders map through `farmer_id = organizations.owner_id`; none are missing an organization-owner match. `organization_members` currently has 0 rows. This is an authoritative key-based mapping candidate, not permission to backfill or alter data without an approved migration and owner sign-off.
- The four tables flagged as RLS-enabled-without-policies (`crop_health_feed_slug_registry`, `marketplace_order_idempotency`, `product_rank_daily_metrics`, `product_rank_events`) grant no SELECT/INSERT to `anon` or `authenticated`; they are service-role-only, so the advisor notice is not by itself a public data exposure.
- The security scan found 37 authenticated-callable SECURITY DEFINER functions and 4 anon-callable ones. Source inspection found 33 of the authenticated-callable functions contain an apparent `auth.uid()`/admin guard; this is a triage signal, not a complete authorization proof. Three anon-callable SECURITY DEFINER functions return aggregate/public catalogue ranking data. The fourth is the `rls_auto_enable` event-trigger function, which should have client EXECUTE grants explicitly revoked in a reviewed migration. `crop_feed_make_slug` is an invoker/pure slug helper; its mutable search_path warning is lower risk but should be fixed with a pinned path.
- Auth leaked-password protection is disabled and must be enabled/verified in the Supabase Auth dashboard before release. The current connected tool surface does not expose that Auth setting for a safe read-only verification.
- Performance advisor also reports 14 unindexed foreign keys, 12 RLS init-plan notices, 4 multiple-permissive-policy notices, and 50 unused-index notices; prioritize the FK/RLS items and do not drop unused indexes without workload evidence.
- No hosted Supabase migrations or settings changes have been applied by this release work.

## Hard release blockers

1. **Confirm the isolated staging database.** Production is now confirmed as `supabase-coral-clock` (`dhqaepsbuwhbynagfxpf`). `agriva-editorial-staging` is a separate active project, but its role as the isolated release staging target still needs owner confirmation before any write operation. Do not use the inactive `agriva-guest-checkout-e2e` project.
2. **Approve the seller-organization migration/backfill policy.** Current production data has 27/27 Marketplace products and 25/25 Marketplace orders linked by `farmer_id` to the owner of a verified organization, with no ownerless rows found. The candidate mapping is therefore based on the existing owner UUID relationship, not names/emails. Still require owner approval and an auditable migration/backfill plan before writing the new organization snapshot fields; do not guess any unmatched future/historical rows.
3. **Complete the Supabase security remediation review.** The read-only production scan found 37 authenticated-callable and 4 anon-callable SECURITY DEFINER functions, one mutable invoker-function search_path, and disabled leaked-password protection. Four no-policy tables have no anon/authenticated table grants and are service-role-only. Three anon-callable SECURITY DEFINER functions serve aggregate/public catalogue data; explicitly revoke client EXECUTE from `rls_auto_enable`; review every privileged function's authorization and output. Do not bulk-revoke grants based only on advisor labels.
4. **Complete performance and functional acceptance on the exact release commit.** A Vercel and Netlify preview now exist for the exact PR head. The current one-path Lighthouse score is Performance 71 and Best Practices 83; audit home, search, product detail, login, checkout, seller dashboard, and admin flows on mobile and desktop. Set a release performance budget and fix measured LCP/INP/CLS causes; a single-route score is not release evidence.
5. **Verify production environment configuration without exposing values.** Confirm production-target values for the Supabase URL and publishable/anon key, server-only service-role/secret key, canonical site URL, and each feature's required provider credentials. Verify callback/redirect URLs and webhook secrets in provider dashboards. Never put service-role or secret keys in `NEXT_PUBLIC_*` variables.
6. **Complete a human-reviewed end-to-end release rehearsal.** Cover signup/login/password reset, organization verification, seller product submission, checkout/COD, order status transitions, cancellation/restock, notifications, admin access, and rollback. Guest checkout E2E has not been activated and must not be treated as covered.

## Pre-deploy sequence

1. Production Supabase ref is confirmed as `dhqaepsbuwhbynagfxpf`; confirm `agriva-editorial-staging` (or another explicitly isolated project) as the staging target with the owner.
2. Take and verify a restorable database backup; record the backup timestamp and retention window.
3. On the isolated staging project, compare migration history with the repository, apply the candidate migrations, run advisors, and execute the application smoke/E2E suite.
4. Review every migration for locks, table rewrites, data loss, backfill cost, and rollback compatibility. Prefer additive expand/contract migrations. Do not automatically backfill legacy seller organizations.
5. Confirm the exact commit SHA, successful GitHub Actions checks, fresh preview URL, Lighthouse results, and manual acceptance evidence.
6. Obtain explicit release approval. Apply database migrations to the confirmed production target in a separately authorized step, verify them, then deploy the exact reviewed application commit.
7. Smoke-test production immediately after release and monitor runtime errors, Auth, database, Storage, checkout, and webhook behavior.

## Rollback

- Keep the previous production Vercel deployment URL and commit SHA recorded before release.
- If the application deployment fails, roll back to the previous known-good Vercel deployment. A rollback does not reverse database migrations.
- Database changes must remain backward-compatible with the previous application version during the rollback window. For irreversible or destructive migrations, stop and prepare a forward-fix plan; do not improvise a reverse migration.
- Reconcile any in-flight orders/payments before retrying checkout or changing order state.

## Free-tier constraints and operational notes

- GitHub Actions is the release validation runner; keep it on the free quota and avoid duplicate runs.
- Vercel preview deployments are currently rate-limited by the free daily deployment quota. Do not upgrade the plan or trigger repeated deploy attempts to bypass the limit.
- Vercel Hobby runtime logs retain only a short window; capture incidents promptly. No Observability Plus configuration was available during inspection.
- Supabase CLI is pinned to v2.81.3 in CI. Supabase's CLI v3 changed local/remote command defaults; keep the current pin until the migration workflow is deliberately upgraded and revalidated.

## Release sign-off

- [x] Production Supabase project reference confirmed (`dhqaepsbuwhbynagfxpf`)
- [ ] Isolated staging project confirmed
- [ ] Verified backup and restore rehearsal
- [ ] Legacy seller mapping policy approved
- [ ] Supabase security advisor findings reviewed and documented
- [ ] Latest commit CI green (Node 24)
- [ ] Fresh preview for exact commit
- [ ] Lighthouse performance budget met on key routes
- [ ] Manual end-to-end acceptance completed
- [ ] Production env vars and provider callbacks verified
- [ ] Rollback target and owner recorded
- [ ] Explicit production release approval recorded
