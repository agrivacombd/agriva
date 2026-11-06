# AGRIVA Production Deployment Runbook — Bangladesh COD Launch

## Operating rules
- COD only. No online gateway, online payment callbacks, or gateway secrets in the launch scope.
- No production schema migration, production data mutation, PR merge, or deployment without explicit user approval after a written change/test summary.
- Never use production to create test orders/products. Use a disposable database or staging project with synthetic data.
- Keep Supabase service-role keys server-only; never put secrets in logs, commits, browser bundles, or chat.

## Release phases
1. Read-only inventory: establish main commit, open PR dependency graph, CI status, Vercel production project/deployment, legacy Netlify relevance, Supabase migration history, current schema, auth providers, and environment variable names (never values).
2. CI/dependency stabilization: reconcile dependency-upgrade PRs, commit a lockfile, pin Node/package manager, run lint, TypeScript, smoke tests, build, and dependency/security review.
3. Checkout/COD correctness: review cart and atomic multi-item checkout, Bangladesh structured address, phone normalization, DB-derived prices, stock locking, all-or-nothing checkout, duplicate-submit/idempotency, and server-side COD enforcement.
4. Admin order desk: admin-only queue/detail, filters and valid state machine, structured address and COD amount, status history/audit, COD collection actor/time/amount, safe cancellation/restock exactly once, reconciliation report.
5. Catalogue/admin: server-authorized product create/edit, image upload/storage policies, draft/active visibility, taxonomy, price/stock validation, role checks and audit.
6. Database rehearsal: replay complete ordered migrations from empty state on a disposable database; check policies, grants, function signatures/overloads, SECURITY DEFINER search_path, and idempotency. Compare staging migration history before applying anything.
7. Security tests: non-admin denied; customer A cannot see/change customer B's order; forged online payment rejected; inactive products rejected; stock contention/rollback; duplicate request; invalid status transition; legacy callbacks inert; secrets not exposed.
8. Staging E2E: synthetic products and test accounts; cart add/update/remove; valid/invalid Bangladesh phone; missing address; COD disabled; checkout success; order ownership; admin status changes; cancellation/failed delivery; COD collection audit; mobile and Bangla rendering.
9. Release candidate: green CI on exact commits, reviewed PR order, Vercel preview succeeds, Netlify failure relevance determined, backup/restore drill, monitoring and rollback plan.
10. Production go/no-go: present exact commits, migration list, backup evidence, CI/preview/E2E results, limitations and rollback plan. Wait for explicit approval. Apply only approved migrations/deploy; verify health, logs and smoke tests. Never auto-merge/deploy.
11. Stabilization: monitor checkout errors, stock mismatches, COD collected-vs-delivered reconciliation, failed deliveries, latency and auth errors; rollback if thresholds are breached.

## Required order state model
- Fulfilment: pending -> processing -> shipped -> out_for_delivery -> delivered. Exceptions: cancelled, failed_delivery, returned. Validate transitions server-side and record audit/history.
- COD collection is separate: not_collected -> collected, with amount, collector identity, timestamp, and reconciliation reference. Delivered must never auto-mark COD as collected.
- Restock and commission reversals must be idempotent, transactional and audited.

## Bangladesh checkout data
Required: recipient name, normalized Bangladesh mobile, division, district, upazila/thana, union/area/ward, village/road/house/holding/building details.
Optional: landmark, postal code, delivery instructions.
Normalize phone server-side. Validate all fields server-side. Delivery charge must be explicit; never silently promise free delivery if policy is not configured.

## Rollback principles
- Every migration needs a forward plan and tested rollback/forward-fix decision; destructive changes require backup and restore rehearsal.
- App rollback must be compatible with database state. Prefer expand-migrate-contract migrations.
- Keep previous successful deployment identifiable. Never drop columns/tables as part of an emergency app rollback.
- Stop rollout on data loss, unauthorized order access, incorrect totals, stock drift, or COD reconciliation mismatch.

## Current blockers to recheck
- Draft PR #28 cart/atomic checkout needs full migration replay and authenticated checkout tests.
- Draft PR #39 Bangladesh address form depends on PR #28 and needs CI plus phone/address edge-case tests.
- Draft PR #38 admin order desk needs schema compatibility validation against final checkout model and status RPC.
- Draft PR #34 PostgreSQL policy syntax fix needs complete migration replay.
- Draft PR #36 disables legacy payment callbacks for COD launch; determine whether Netlify preview failures are relevant and test endpoints in staging.
- Draft PRs #19 and #22 have dependency/schema/authorization concerns documented in PR comments; reconcile before merging.
- No verified end-to-end production-like checkout or COD collection audit evidence yet.
- Inspect migration history/current production schema read-only; do not assume migration files equal deployed schema.

## Per-step evidence log
Record commit SHA, CI run, migration replay output, staging E2E results, risks, approval, deployment ID, post-deploy smoke test and rollback readiness for each release step.
