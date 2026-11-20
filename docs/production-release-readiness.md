# Production release readiness — AGRIVA

> **Release state: HOLD.** This document is an operational gate, not approval to deploy.
> No production database migration, domain promotion, or merge is authorized by this checklist.

## Verified in the current release work

- The complete AGRIVA SQL migration chain replays successfully against a disposable local Supabase stack in GitHub Actions.
- Marketplace database tests and the full-schema seller-organization runtime tests passed in AGRIVA CI run [#3534](https://github.com/agrivacombd/agriva/actions/runs/44764971445).
- Green Living PostgreSQL integration passed in run [#44](https://github.com/agrivacombd/agriva/actions/runs/44764970785).
- The above runs validate commit `8352a28c513fc099a81cc83c056ea5d0a719df97`. A subsequent release-readiness change aligns CI with Vercel's Node 24 runtime and switches Vercel installs to `npm ci`; that exact head must pass CI before review.
- The production Vercel project is `agriva-p8g6`. Its verified production domains are `agriva.com.bd` and `www.agriva.com.bd` (the latter redirects to the apex).
- The current production deployment still points to `main` commit `504f3bc835e96a0d126f044f91e5b92ae7954a3e`; the PR branch has not been deployed to production.
- The current PR head did not have a Vercel preview deployment at the time of inspection. Vercel's free daily deployment quota blocked newer preview attempts. Netlify preview for commit `8352a28` reported Lighthouse: Performance 52, Accessibility 96, Best Practices 83, SEO 100, PWA 90. Performance and best-practices regressions need a fresh, multi-route audit before release.
- No hosted Supabase migrations have been applied by this release work.

## Hard release blockers

1. **Identify the production database explicitly.** The connected `supabase-coral-clock` project is active, but its role as production has not been confirmed. `agriva-editorial-staging` is a separate active project, but must be confirmed as the intended isolated staging target before any write operation. Do not use the inactive `agriva-guest-checkout-e2e` project.
2. **Approve legacy seller mapping.** Existing Marketplace products without a verified organization must remain non-purchasable; organization-less historical orders remain admin-only. Before restoring seller-managed flows, approve an auditable mapping source and owner sign-off. Never infer organization ownership from seller names or email addresses.
3. **Review Supabase security advisors against the confirmed production project.** A read-only scan of `supabase-coral-clock` returned warnings for public/authenticated execution of SECURITY DEFINER functions, one mutable function search_path, and leaked-password protection being disabled. Some functions intentionally serve public, filtered catalogue data, and some tables are deliberately service-role-only; review each function's authorization and data exposure individually. Do not bulk-revoke grants based only on advisor labels.
4. **Re-run performance and functional acceptance on the exact release commit.** Obtain a fresh Vercel/Netlify preview and audit home, search, product detail, login, checkout, seller dashboard, and admin flows on mobile and desktop. Set a release performance budget and fix the measured LCP/INP/CLS causes; a single-route score of 52 is not acceptable evidence of readiness.
5. **Verify production environment configuration without exposing values.** Confirm production-target values for the Supabase URL and publishable/anon key, server-only service-role/secret key, canonical site URL, and each feature's required provider credentials. Verify callback/redirect URLs and webhook secrets in provider dashboards. Never put service-role or secret keys in `NEXT_PUBLIC_*` variables.
6. **Complete a human-reviewed end-to-end release rehearsal.** Cover signup/login/password reset, organization verification, seller product submission, checkout/COD, order status transitions, cancellation/restock, notifications, admin access, and rollback. Guest checkout E2E has not been activated and must not be treated as covered.

## Pre-deploy sequence

1. Confirm the exact production Supabase project reference and the isolated staging project reference with the project owner.
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

- [ ] Production Supabase project reference confirmed
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
