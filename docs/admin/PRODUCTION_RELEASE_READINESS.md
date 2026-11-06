# AGRIVA Production Release Readiness

Last reviewed: 2026-11-06
Repository: `agrivacombd/agriva`
Candidate PR: [#217](https://github.com/agrivacombd/agriva/pull/217)
Candidate branch: `feat/admin-control-center-architecture-v1`
Reviewed head: `4655e6fb455340f4c5cb24ab47cb3d9834bf1f32`

## Current decision

**NOT READY TO DEPLOY TO PRODUCTION.** This document prepares the release path; it does not authorize merge, Production deployment, or database changes.

## Verified blockers

1. **Branch divergence:** candidate is 254 commits ahead and 39 commits behind `main`. GitHub reports PR #217 as draft, `mergeable=false`, `mergeable_state=dirty`. Reconcile the branch with current `main` using a reviewed, non-destructive strategy; do not force-push or discard commits.
2. **Vercel build quota:** the current commit status reports Vercel failure with the build-rate-limit URL. The latest inspected Vercel deployment is `ERROR`; a READY preview exists only for older commit `cbeff37a7742044fee4b86e6930a725564edf0a9`, not this candidate head.
3. **CI freshness:** the latest successful GitHub Actions run found in branch history is for older commit `a6132984b6bb986726d9d38e140ba2ca5d69f771`. No successful CI run was found for reviewed head `4655e6f`.
4. **Supabase migration reconciliation:** repository migration files and Production migration history have unresolved unmatched/ambiguous entries. Do not apply pending migrations until each candidate migration is content-compared with the live schema/history and ordered dependencies are confirmed.
5. **Admin authorization runtime tests:** the isolated Supabase integration harness is committed but has not been run against an approved isolated branch with seeded non-admin, legacy Admin, delegated Admin, and no-grant delegated Admin accounts.
6. **Preview verification:** current candidate has no successful preview deployment; responsive UI, critical Admin routes, auth, and production-like flows still need browser verification.
7. **Release scope:** finance mutations remain intentionally disabled. Do not enable COD settlement, payout, refunds, payment settings, indexing changes, content publishing, or other high-impact operations as part of this UI release without separate approval.

## Release sequence after quota recovers

### Gate A — Source reconciliation
- Fetch latest `main` and compare again.
- Reconcile the 39-commit divergence without destructive rebase/force-push.
- Review overlapping PR history and ensure PR #217 remains the sole chosen release vehicle.
- Re-run static checks and inspect final diff for secrets, test credentials, accidental production config, and unintended migration changes.

### Gate B — CI and preview
- Require current-head GitHub Actions CI success: lint, TypeScript, all smoke tests, static Admin security contracts, and production build.
- Require Vercel Preview READY for the exact reviewed commit SHA.
- Browser-check public home, auth, marketplace, Plant Market, checkout, orders, and all eight Admin workspace areas on desktop and mobile.
- Verify role boundaries for legacy Admin and delegated Admin; confirm unauthorized routes and mutations fail closed.
- Record preview URL, commit SHA, test run URLs, and known issues in this document.

### Gate C — Database and security
- Complete a content-level reconciliation of every unmatched/ambiguous repository migration against the target Supabase project.
- Run pending migrations only in an isolated Supabase branch first.
- Verify RLS USING/WITH CHECK, function EXECUTE grants, SECURITY DEFINER search_path, Storage policies, and audit transactionality.
- Run `npm run test:admin-authz-integration` with isolated seeded accounts and record results.
- Obtain explicit approval before applying any Production migration or changing production data, grants, Auth settings, or payment controls.

### Gate D — Production release
- Confirm the exact commit SHA, target Vercel team/project, production domains, and environment configuration.
- Use a staged Production deployment with domains unassigned, then smoke-test that exact staged build.
- Promote only the tested staged Production deployment after explicit release approval.
- Never promote an older Preview as a substitute for a current reviewed Production build.
- Preserve the current known-good production deployment as rollback target; document rollback procedure and owner.
- Do not deploy if the candidate SHA differs from the tested SHA.

### Gate E — Post-release verification
- Check public routes, authentication, Admin capability boundaries, checkout/order read paths, and error logs.
- Confirm domain assignment, canonical URLs, sitemap, robots behavior, and critical redirects.
- Monitor runtime errors and key business flows; rollback if critical auth, payment, order, or availability regressions occur.

## Current deployment facts

- Vercel project: `agriva-p8g6` (Next.js), team `agriva1`.
- Production domains configured on the project: `agriva.com.bd`, `www.agriva.com.bd`.
- Reviewed candidate SHA: `4655e6fb455340f4c5cb24ab47cb3d9834bf1f32`.
- Vercel status target at review: build-rate-limit failure.
- No Production deployment, merge, migration application, or production setting change was performed during this preparation.

## Release operator checklist

- [ ] Vercel build quota available
- [ ] Branch reconciled with latest `main`; PR mergeable
- [ ] Current-head GitHub CI green
- [ ] Current-head Vercel Preview READY
- [ ] Desktop/mobile preview QA recorded
- [ ] Supabase migration content reconciliation complete
- [ ] Isolated Supabase RLS/RPC/Storage tests passed
- [ ] Admin authorization integration tests passed
- [ ] Production migration plan separately approved
- [ ] Exact release SHA and target project verified
- [ ] Explicit Production release approval received
- [ ] Staged Production build smoke-tested
- [ ] Promotion approved and post-release monitoring assigned
