# AGRIVA Supabase migration reconciliation — read-only audit (2026-11-12)

## Scope and safeguards
- Inspected existing project `dhqaepsbuwhbynagfxpf` with read-only SQL.
- No staging branch, database mutation, migration repair, or deployment was performed.
- GitHub migration filenames and remote Supabase migration names/versions do **not** follow a one-to-one convention. Never auto-mark migration history as applied based on filename matching.

## Confirmed observations
- Remote migration history: 121 records. GitHub `main` tree: 120 migration SQL files at audit time.
- Naive filename/name comparison yielded 34 unmatched repository files; this is **not** a reliable pending-migration count.
- `public.content_drafts`: RLS enabled; admin-all policy and published-article read policy.
- `public.content_opportunities`: RLS enabled; admin read/insert/update policies.
- `public.seo_landing_pages`: RLS enabled; admin-all and published-only anon read policies.
- `public.published_articles` view: `security_invoker=true` and filters to published articles.
- `public.content_draft_revisions`: not present.
- `public.content_drafts`: no non-internal triggers. Historical workflow guard and revision-capture migrations in GitHub are not reflected in this remote schema.
- `public.seo_engine_jobs` and `public.seo_engine_usage`: not present, as expected for an unmerged feature migration.
- Historical SQL files include duplicate filename version prefix `20261105180000` (two separate migrations).

## Blocking compatibility risks
1. Do not enable automatic publishing while the content draft workflow trigger is absent.
2. Do not rely on the revision-history UI until the revisions table and its RLS/grants are reconciled.
3. Do not apply every GitHub migration as a batch: remote history contains separately deployed migrations and version/name differences.
4. Preserve `published_articles` security-invoker behavior and published-only anonymous access.

## Safe next steps
1. Identify the canonical production migration ledger and deployment path.
2. Prepare an **additive**, idempotent forward-only repair migration, scoped to the missing workflow trigger/revision table after verifying dependencies and existing data.
3. Test the repair in a disposable local PostgreSQL/Supabase environment or an explicitly approved staging project.
4. Validate anonymous/authenticated/admin read/write scenarios, workflow transitions, and revision capture before deployment.
5. Keep the SEO Engine PR as draft until those checks pass.

This report is an audit record, not a claim of PostgreSQL migration execution.
