# AGRIVA Super Admin — Authorization, RPC, RLS & Audit Review

**Review date:** 2026-11-06  
**Branch:** `feat/admin-control-center-architecture-v1`  
**Review type:** Static source and migration review. No live Supabase project was queried or changed. No migration was applied.

## 1. Executive findings

| Area | Status | Finding |
|---|---|---|
| Shared Admin page/API guard | Partial | `requireAdminPage` / `requireAdminApi` verify the server session, profile, capability and fail closed on permission-RPC errors. Some routes still use direct `profiles.role = admin` checks instead of the shared guard. |
| Delegated permission RPC | Partial | `public.has_admin_permission(text)` checks the current authenticated user's active global role assignment. Actual deployed role grants and RLS behavior were not runtime-tested. |
| Finance RPC boundary | Blocked | UI mutation flag is false; high-risk finance RPC execution is revoked from client roles by the forward hardening migration. Do not re-enable before dedicated service-role/RPC design and reconciliation tests. |
| Role grant/revoke RPC | Partial | Direct client table writes are revoked; actor-bound grant/revoke RPCs require `roles.grant` and active global `super_admin`, prohibit self-change, protect the final Super Admin and write audit events. |
| RLS coverage | Partial | Forward policy updates now support explicit delegated reads for Transport, Green Exchange and Audit Log. A complete live policy inventory, grants inventory and role-by-role negative test has not been run. |
| Audit coverage | Partial | Transport verification now writes an atomic before/after status event to `admin_audit_log`; other workflows use separate event tables. The Audit UI still reads only a bounded recent slice. |
| Environment verification | Blocked | Latest Preview is unavailable due Vercel build rate limit. Supabase migration state and live RLS/RPC behavior have not been verified. |

## 2. Concrete issues found and corrected in this branch

The new role-management migration `20261104150000_admin_role_grant_security.sql` called `private.has_admin_permission('roles.grant')`, but the reviewed permission helper is defined as `public.has_admin_permission(text)`. This would make the role grant/revoke RPC fail at runtime if no separate private helper existed.

- Corrected both calls to `public.has_admin_permission('roles.grant')`.
- Updated `scripts/smoke-admin-authorization.mjs` to assert the real function contract and reject the undefined private reference.
- This is a source-level correction only. The migration is not applied to any Supabase environment.

### Transport and Green Exchange forward hardening\n\nAdded `20261106130000_admin_transport_green_exchange_audit_security.sql` without editing earlier migrations. Transport verification now accepts either legacy Admin or `transport.moderate`, locks the target row, validates status/note, and writes the previous/new status in `admin_audit_log` in the same transaction. Transport queue reads now include `transport.read`. Green Exchange moderation now accepts legacy Admin or `green_exchange.moderate`; its read policy supports `green_exchange.read`. Audit Log RLS supports `audit.read`.\n\nThe Green Exchange, Audit and Reports pages now use the shared `requireAdminPage` capability guard. Reports and CSV export remain gated by `reports.export`.\n\n## 3. Authorization and RPC inventory

| Workflow | Application guard | Database enforcement | Audit evidence | Remaining verification |
|---|---|---|---|---|
| Marketplace product create | `catalog.create` | `admin_create_marketplace_product` checks admin actor and validates draft creation | `admin_audit_log` | RPC grants, trigger/RLS behavior and duplicate-submit handling in isolated DB |
| Marketplace product edit | `catalog.edit` / server action | `admin_update_product` and related guarded update paths | `admin_audit_log` for legacy update RPC; verify every new field path | Confirm all edit paths use audited RPCs; verify slug/SEO paths separately |
| Marketplace slug change | Product editor guard | `admin_update_product_slug` checks authenticated admin and validates slug | `admin_audit_log` | Unique/redirect constraints and concurrent slug changes |
| Plant Market product edit | `catalog.edit` | Authenticated Supabase update plus seller grant/verification trigger checks | Service-role audit intent, failure and completion events | Prove update policy and audit service credentials in Preview; ensure audit finalization failures are operationally recoverable |
| Plant Market moderation | Capability-filtered Admin route | Separate guarded management API/RPC path | Review event coverage in API | Negative tests for non-admin, unverified seller and missing grant |
| Order status | `orders.transition` | Public wrapper validates auth and status allowlist; private function performs owner/admin checks | Not confirmed as a universal admin audit event | Confirm order transition actor, state machine and idempotency in isolated DB |
| COD collection / commission / payout | Finance capability + UI feature flag | Forward migration revokes direct client execution for sensitive RPCs | Historical audit coverage needs verification | Remains blocked; design a dedicated audited service-role workflow |
| User profile role change | `roles.grant` application guard | `admin_set_user_role` allows only farmer/reseller and prevents self-change | `admin_audit_log` | Test protected roles, concurrency and all profile/RBAC membership sync effects |
| Admin RBAC grant/revoke | RPC-level check | Direct table writes revoked; actor must have `roles.grant` and active global `super_admin`; no self-change; last Super Admin protected | Transactional `admin_audit_log` | Apply only to isolated DB; verify role table read RLS and role-permission seeding |
| Identity/module application review | `identity.review` | `admin_review_module_application`; trigger syncs module grants and identity records | `module_access_application_events` | Verify private evidence storage, signed URLs, approval/rejection rollback and actor binding |
| Jobs moderation | `jobs.moderate` | `admin_moderate_job_post` validates admin, transition and note | `job_moderation_events` | Verify table RLS, retention and audit UI visibility |
| Transport verification | `transport.moderate` | Forward migration accepts legacy Admin or delegated capability; row is locked and status/note validated | Atomic `admin_audit_log` event captures previous/new status and note length | Run isolated negative/positive role tests; verify deployed migration state |
| Green Exchange moderation | `green_exchange.moderate` shared guard | Forward RPC accepts legacy Admin or delegated capability; status validated and row locked | `admin_audit_log` captures previous/new status | Run isolated negative/positive role tests; verify deployed migration state |
| Module access revocation | API/UI path requires admin | `admin_revoke_market_access` validates actor/module/scope | `admin_audit_log` includes grant/application counts | Verify caller capability, organization scope and replay behavior |
| Site settings | `settings.write` | `admin_update_site_setting` validates admin and key/value path | `admin_audit_log` | Confirm setting allowlist, max lengths and no secret values in metadata |
| Audit viewer | `audit.read` shared guard | Forward RLS policy allows legacy Admin or delegated `audit.read` | Reads latest 100 rows | Run isolated RLS tests; add pagination/filtering and export permission boundary |

## 4. Automated test harnesses\n\n- `npm run test:admin-security-contracts` checks the source-level security contracts and known high-risk deny-by-default rules.\n- `npm run test:admin-authz-integration` runs real authenticated RPC/RLS checks against a dedicated isolated Supabase project. It requires four pre-provisioned test accounts: non-admin, legacy Admin, delegated Admin with `transport.moderate`, `green_exchange.moderate`, `audit.read`, and delegated Admin without those grants. Credentials are read only from environment variables; no secrets are committed.\n- Integration test RPC calls use random non-existent entity UUIDs. Authorized users must pass the permission boundary and receive `P0002`; unauthorized users must receive `42501`, so no business rows are mutated.\n\nThe integration harness is committed but has not yet been executed because a dedicated branch/project and test-account fixtures have not been approved/provisioned.\n\n## 5. RLS and privilege review checklist

Before calling this audit complete, run these checks against an isolated Supabase branch with representative users:

- [ ] Anonymous user cannot read private identity evidence, pending applications, role assignments, audit rows, private content drafts or private orders.
- [ ] Authenticated non-admin cannot call any Admin SECURITY DEFINER RPC, even if it knows the function name and IDs.
- [ ] Legacy Admin can perform only the explicitly allowed capabilities; high-risk finance and recovery capabilities remain denied.
- [ ] Delegated Admin without the relevant capability is denied by both the app guard and database function.
- [ ] A scoped organization/farm grant cannot operate outside its scope; current global-only Admin permission helper behavior is documented and tested.
- [ ] RLS UPDATE policies include both `USING` and `WITH CHECK` where users can update their own rows.
- [ ] SECURITY DEFINER functions use a fixed safe `search_path`, explicit actor checks, validated inputs and least-privilege EXECUTE grants.
- [ ] No SECURITY DEFINER RPC is unintentionally executable by `PUBLIC` or `anon`.
- [ ] Storage policies bind evidence object paths to the authenticated owner and allow Admin review only.
- [ ] Audit insert and business mutation are in the same database transaction for RPC workflows; if an external service-role audit write is used, test partial failure and reconciliation.
- [ ] Audit events capture actor, entity, action, timestamp and safe before/after or changed-field metadata without secrets or unnecessary PII.
- [ ] Role revocation and user suspension behavior is tested with existing sessions and token refresh/revocation semantics.

## 6. Priority remediation queue

### P0 — before enabling sensitive operations
1. Add an audit event to Transport partner verification and a regression test.
2. Run isolated-database negative authorization tests for every Admin RPC.
3. Verify migration history, grants, RLS and Storage policies against the actual target project.
4. Keep COD, payout, refund and recovery operations disabled until transactionality, idempotency, reconciliation and audit are proven.

### P1 — before Phase 3 content publishing rollout
1. Move Green Exchange, Audit and Reports pages from direct role checks to shared capability guards.
2. Verify that every content mutation has actor-bound review/publish/unpublish events and immutable revisions.
3. Confirm that public article reads expose only published article columns and no editorial/private metadata.
4. Add audit pagination and filter controls without exposing sensitive metadata to non-auditors.

### P2 — operational completeness
1. Add role/grant administration UI with explicit Super Admin-only controls and expiry/scope display.
2. Add system health, backup verification and integration status pages.
3. Add audit export only behind `audit.export`, with access logging and PII minimization.

## 7. Evidence limitations

This review reads committed application code and SQL migration files only. It does not establish:
- which migrations are applied to production,
- whether the live database schema matches this branch,
- actual grants or RLS policy definitions in a live database,
- whether RPCs succeed for real user sessions,
- whether service-role environment variables are configured,
- whether Vercel's latest deployment builds and renders correctly.

No production database, user data, payment settings or live deployment was modified.
