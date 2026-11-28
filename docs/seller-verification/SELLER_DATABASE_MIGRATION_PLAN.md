# Seller Verification Database & Migration Plan

**Migration status:** Design only. No SQL migration is proposed or applied in Phase 0.

## 1. Existing entities to reuse

| Existing object | Purpose | Proposed action |
|---|---|---|
| `module_access_applications` | One application per user/module | Reuse; inspect constraints and JSON contract before extension |
| `user_module_grants` | Module access source of truth | Reuse; no client writes |
| `organizations` | Marketplace business profile | Reuse; avoid duplicate business table |
| `gardener_profiles` | Plant Market identity/domain verification | Reuse; consider explicit nursery profile only if the model gap is proven |
| `module_access_application_events` | Append-only lifecycle events | Reuse; add event types only with reviewed constraints/trigger |
| `admin_roles`, `admin_role_permissions`, `admin_user_roles` | Admin RBAC | Reuse |
| `identity-verification` Storage bucket | Private identity evidence | Reuse only after storage policies and retention are reviewed |

The merged PR #406 added indexes on `module_access_applications(module, status, reviewed_at desc)` for reviewed history and `(module, created_at desc)` for recent queues. Avoid duplicate indexes.

## 2. Data model direction

Prefer the current application row as the workflow aggregate:
- `user_id`, `module`, `applicant_type`, `organization_id`, `status`, reviewer fields and timestamps.
- A versioned, allowlisted market-specific payload for fields not shared across modules.
- Evidence object paths and typed metadata; never signed URLs or public identity-document URLs.
- Existing append-only events for submission and decision history.
- Existing domain records for organization and gardener verification.
- Existing grants for authorization.

Potential future additions, only if required after schema audit:
- A typed evidence metadata table if JSON payload size, queryability, expiry or per-document review cannot be safely handled in the existing model.
- A Plant Market nursery/business profile if a nursery's multiple locations, ownership, registration and staff cannot be represented by `gardener_profiles`.
- A verification provider result/reference table if external identity checks are introduced.
- A request-more-information event/state with explicit transition constraints.

Do not create all of these pre-emptively.

## 3. Proposed migration sequence

### M0 — No-op discovery and schema reconciliation
- Compare repository migrations with the actual target project's migration ledger and schema inventory.
- Confirm current definitions, constraints, triggers, grants, RLS and Storage policies.
- Confirm which migrations are already applied and which are branch-only.
- Do not connect to or mutate Production for exploratory DDL.

### M1 — Additive schema contract (only after review)
- Add only missing typed fields / enum constraints / indexes.
- Keep legacy applicant payloads readable.
- Add explicit versioned validation for new payloads.
- Add no destructive rename/drop/backfill in the first release.
- Apply to disposable local Supabase first.

### M2 — Evidence metadata and Storage hardening (if needed)
- Keep private bucket.
- Validate ownership, MIME signature, size and document type.
- Enforce applicant-scoped upload and reviewer-scoped signed reads.
- Define expiry, deletion and legal hold behavior.
- Never broaden bucket read policy to all authenticated users.

### M3 — Transactional workflow and grants
- Reuse `admin_review_module_application`.
- Keep application state, organization/gardener state, grants and audit events atomic.
- Verify duplicate-submission race behavior with a unique constraint.
- Verify approval and revocation under concurrent requests.
- No direct browser mutation of decision/grant tables.

### M4 — Rollout compatibility
- Deploy additive schema before code that depends on it, after explicit approval.
- Deploy server/API with backward-compatible reads.
- Enable new fields per seller type behind a feature flag if needed.
- Do not auto-approve existing sellers or recategorize existing products.
- Preserve old application history and evidence access for authorized users.

## 4. Test requirements

- Migration replay from a clean disposable database.
- Upgrade test from the latest supported schema.
- RLS tests for anon, applicant A, applicant B, reviewer, non-reviewer and Admin.
- Storage tests for cross-user path access, wrong bucket, wrong MIME, oversized file, duplicate path and expired signed URL.
- Concurrency test: two submissions for same user/module; exactly one open application.
- Approval transaction test: status, organization/gardener state, grants and event are consistent or all roll back.
- Rejection test: reason required, no access grant, history retained.
- Revocation/expiry test: both API and RLS deny future writes.
- Backward compatibility test for existing Marketplace and Plant Market sellers.
- Run Supabase security advisors and inspect all changed policies/functions.

## 5. Release safety

Phase 0 authorizes no migration. Phase 1 must produce an exact migration diff and rollback/forward-fix plan. Test on isolated Supabase before any shared staging. Production migration requires a separately reviewed release plan, preflight, backup/restore strategy and explicit user approval.
