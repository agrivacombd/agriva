# Production Supabase live inventory snapshot

Captured: 2026-10-27 UTC  
Purpose: read-only evidence for issue #65 and the Production reconciliation runbook.  
**This is an inventory only. It does not authorize SQL writes, migration replay, migration-history edits, or a Vercel environment change.**

## Projects and target identity

- Vercel Production runtime was previously observed using `dhqaepsbuwhbynagfxpf.supabase.co`.
- Supabase project `dhqaepsbuwhbynagfxpf` (`supabase-coral-clock`, `us-east-1`) is ACTIVE_HEALTHY and is the Production-connected target. It contains real application data.
- Separate Supabase project `utytcoxpjnoanqffkqft` (`agriva`, `ap-southeast-2`) is also ACTIVE_HEALTHY, but it is a different data store and must not be substituted as Production.
- No paid resources, Supabase branches, test accounts, or test payment records were created during this inventory.

## Current migration history

Read-only Supabase migration-list calls returned:

| Target | Latest observed migration | Relevant difference |
|---|---|---|
| Production-connected `dhqaepsbuwhbynagfxpf` | `20261024081422 stable_marketplace_taxonomy` | No later Jobs / role-membership / content workflow migrations shown |
| Separate `utytcoxpjnoanqffkqft` | `20261025181525 optimize_rls_auth_uid_initplans` | Contains later migrations, including Jobs and content workflow work |

The two projects use different recorded versions for the same early migration names (for example `001_agriva_core`), so comparing version numbers or migration names alone is not proof that their SQL effects match. The histories also diverge in the middle: the Production-connected project records product feature-control migrations that do not appear in the separate project's history, while the separate project records harvest-marketplace and learning-correction migrations that are not listed in the Production-connected history.

## Confirmed table-presence differences

Read-only `information_schema.tables` query against Production-connected project:

- Missing: `public.job_posts`, `public.job_applications`, `public.job_moderation_events`, `public.harvest_listings`, `public.learning_correction_reports`, `public.user_role_memberships`, `public.content_draft_revisions`.
- Present: `public.product_form_feature_settings`, `public.admin_feature_permission_grants`, `public.product_subcategories`.

The separate project has `public.job_posts`, `public.job_applications`, `public.job_moderation_events`, `public.harvest_listings`, `public.learning_correction_reports`, `public.user_role_memberships`, and `public.content_draft_revisions`. This does **not** mean the Production-connected project can safely receive every migration from that project or from the current repository.

## Production profile prerequisite snapshot

Production-connected `public.profiles` currently exposes these columns: `id uuid NOT NULL`, `full_name text NULL`, `phone text NULL`, `role USER-DEFINED NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`.

This is only a column inventory. It does not prove that the Jobs migration's expected role enum values, constraints, policies, triggers, or authorization semantics are equivalent.

## Immediate implication for Jobs

The deployed `/jobs` route has previously logged PostgREST `PGRST205` because `public.job_posts` is missing from the Production-connected database schema cache. The repository migration `supabase/migrations/20261025110000_agriculture_jobs_marketplace.sql` creates multiple Jobs objects and policies; it must not be replayed blindly because the migration histories and production-only objects differ.

## Required next reconciliation work

1. Compare every repository migration's SQL against live object definitions, not just migration names.
2. Inventory Production-only tables, columns, constraints, indexes, policies, grants, triggers, functions, enums, and Data API exposure.
3. Classify each migration as not applied, already equivalent, partial/divergent, Production-specific, or unclear.
4. Prepare deterministic preflight and postflight SQL and a reviewed backup/recovery plan.
5. Test migration SQL in a local disposable PostgreSQL-compatible environment; do not create a paid Supabase project or branch.
6. Require explicit Production-owner approval for the exact migration plan and maintenance window before any Production write.

## Safety record

- All database calls used for this snapshot were read-only listing or SELECT queries.
- No migration was applied or marked applied.
- No schema, grants, RLS policies, data, or Vercel environment variables were changed.
