# Production Supabase migration reconciliation runbook

Status: planning only. This document does not authorize a database change.

## Why this runbook exists

The Vercel Production runtime has been observed connecting to the Supabase project whose host is `dhqaepsbuwhbynagfxpf.supabase.co`. Requests to `/jobs` have returned PostgREST `PGRST205` because `public.job_posts` is missing from that project's schema cache.

Read-only inventory on 2026-10-26 found migration-history and schema drift between this Production-connected project and the separate Supabase project `utytcoxpjnoanqffkqft`. The separate project has Jobs tables and a later migration history, but also differs in other tables and data. It must not be substituted as Production or treated as a clean copy.

The Production-connected database contains real application data. **Do not replay migrations, edit migration history, change the Vercel Supabase URL, or run production DDL as a troubleshooting shortcut.**

## Phase 1 — Freeze and identify the target

- [ ] Confirm the exact Vercel Production deployment and runtime Supabase hostname.
- [ ] Confirm the target Supabase project ID in the Supabase dashboard/API, not just by a copied environment value.
- [ ] Confirm the project is the intended production data store with the application owner.
- [ ] Record current deployment SHA, current migration list, database version, extensions, exposed schemas, and relevant Data API settings.
- [ ] Keep the separate project read-only; do not copy credentials, data, or change the Production URL to point at it.

## Phase 2 — Build a migration and schema inventory (read-only)

- [ ] Enumerate every migration file in `supabase/migrations/` on the intended release commit.
- [ ] Export the migration-history rows from the Production-connected database and the separate project for comparison.
- [ ] Compare by SQL content and resulting schema, not only by migration version/name. Record renamed/equivalent migrations explicitly.
- [ ] For each migration missing from Production, inspect prerequisites, DDL, policies, grants, triggers, functions, enum changes, and data backfills.
- [ ] Compare actual live schema objects (tables, columns, constraints, indexes, RLS policies, grants, functions, triggers, enums) with the expected post-migration state.
- [ ] Identify Production-only objects and migrations before considering any replay. Do not drop or overwrite objects merely because they are absent from the repository or the other project.
- [ ] Verify migration SQL can be applied in the intended order and is safe to retry; `IF NOT EXISTS` alone does not prove semantic equivalence.

## Phase 3 — Prepare a reviewed reconciliation plan

For every migration, classify it as one of:

1. **Not applied:** its effects are absent and it can be safely applied after prerequisites.
2. **Already equivalent:** the effects are present, but migration history differs. Document object-by-object proof before any history reconciliation.
3. **Partially applied or divergent:** requires a bespoke, forward-only repair migration with explicit preconditions.
4. **Production-specific:** preserve and document; do not replay or remove automatically.
5. **Unsafe/unclear:** block rollout until an owner resolves the discrepancy.

- [ ] Create a migration-to-live-schema matrix with evidence and the intended action for every row.
- [ ] Review security-sensitive migrations separately: RLS, grants, SECURITY DEFINER functions, role/auth triggers, payment and payout RPCs.
- [ ] Prepare a preflight query that fails if assumptions about columns, constraints, policies, grants, or existing rows are not true.
- [ ] Prepare postflight checks for schema, RLS, grants, function execution permissions, and PostgREST visibility.
- [ ] Document backup/PITR recovery availability, restoration steps, estimated downtime, rollback limitations, and the person authorized to execute recovery.
- [ ] Review the final SQL and run it against a disposable local PostgreSQL/Supabase-compatible environment where feasible. Do not create a paid Supabase project or branch for this work.

## Phase 4 — Explicit production release gate

No Production write is authorized by this document. Before execution, require all of the following:

- [ ] A reviewed, deterministic SQL plan and exact commit SHA.
- [ ] Confirmed target project identity and verified recovery/backup plan.
- [ ] Successful preflight checks and recorded baseline.
- [ ] Security review of RLS, grants, privileged functions, and migration-history reconciliation.
- [ ] Explicit approval from the Production owner for the specific migration plan and maintenance window.

Never mark a migration as applied solely to make the migration list look aligned. Only reconcile history after proving that the migration's intended effects already exist exactly, and use a reviewed procedure appropriate to the installed Supabase CLI/version.

## Phase 5 — Jobs-specific verification after an approved rollout

- [ ] Confirm `job_posts`, `job_applications`, and `job_moderation_events` have the expected columns, constraints, indexes, triggers, and RLS policies.
- [ ] Verify table privileges and RLS behavior for anonymous, authenticated candidate, employer, and admin roles without creating Production test accounts or records.
- [ ] Verify the `admin_moderate_job_post` function's grants and authorization checks.
- [ ] Reload/verify PostgREST schema visibility only after the schema is confirmed correct.
- [ ] Check `/jobs` and public job detail pages, including the empty-state and error path; confirm no private location or applicant data is exposed.
- [ ] Verify application submission binds the server-resolved published job and rejects expired/missing jobs.
- [ ] Watch Production logs for recurring `PGRST205` and application errors.
- [ ] If any preflight or postflight assertion fails, stop; do not continue with later migrations. Follow the approved recovery plan.

## Current known blocker

Issue [#65](https://github.com/agrivacombd/agriva/issues/65) tracks the confirmed migration drift. Until that reconciliation is complete, Jobs should be treated as not operational even if the route itself returns HTTP 200.

This runbook is documentation only: it makes no database, auth, environment, or application-data changes.
