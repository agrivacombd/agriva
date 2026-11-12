# Approved production retry when Vercel quota resets

**State: prepared, disabled.** This workflow is intentionally not active on production until reviewed and merged into the default branch and release settings are configured.

## How it works
- GitHub Actions checks every six hours, avoiding aggressive retry loops.
- Only runs on `main` when repository variable `AUTO_PRODUCTION_RETRY_ENABLED=true`.
- Requires `APPROVED_PRODUCTION_SHA` to exactly match the checked-out `main` commit.
- Requires successful named CI checks (`quality`, `content-migration-execution`, `staging-http`, `editorial-seo`).
- Requires latest production deployment to be for the approved SHA and to have failed with a recognized quota/rate-limit error. Existing READY releases, unknown failures and changed commits block retry.
- Uses GitHub environment `production` and Vercel CLI to deploy after the gate passes. Set environment reviewers if you want an additional human approval.

## Required configuration
1. Review the entire PR, finish staging security tests, backup validation, article image and editorial approvals.
2. Merge the release workflow to `main` only after production-readiness signoff. A scheduled workflow on a feature branch will not run.
3. Add GitHub Actions secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (the correct AGRIVA project).
4. Add repository variables `APPROVED_PRODUCTION_SHA` (full 40-character main SHA) and `AUTO_PRODUCTION_RETRY_ENABLED=true` **only after explicit release approval**.
5. Ensure all four required CI check names run on the approved main commit; otherwise the gate will refuse deployment.
6. Confirm Vercel error codes for your actual quota failure. If Vercel returns an unrecognized error shape, retry is deliberately blocked until reviewed.
7. After a successful release, set `AUTO_PRODUCTION_RETRY_ENABLED=false` or clear `APPROVED_PRODUCTION_SHA`.

## Limits
This does not increase Vercel quota, predict its exact reset time, guarantee deployment, bypass review, or automatically merge drafts. It retries only an explicitly approved, already-attempted production revision after a quota-related failure, at most once per six-hour schedule (if still eligible). It does not migrate Supabase or publish articles.

Vercel documentation:
- https://vercel.com/docs/limits
- https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel
