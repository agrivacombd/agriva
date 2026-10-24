# AGRIVA Phase 0 — Initial Source Audit

**Audit type:** Read-only repository source review  
**Baseline:** `main` at the time of review; exact commit recorded in the associated PR metadata  
**Scope:** Application source and migration files only. No production database or provider settings were changed.

## Confirmed findings

### P0 — Migration chain risk
- `supabase/migrations/013_inventory_commission_orders.sql` contains `CREATE POLICY IF NOT EXISTS`.
- PostgreSQL does not support `CREATE POLICY IF NOT EXISTS`; a clean replay can fail at this statement.
- A separate draft fix is proposed in PR #34. It must be tested by replaying the full migration chain against a disposable database before approval.
- **Unknown:** whether migration 013 has been applied in production. Do not infer production state from source files.

### P0/P1 — Dependency reproducibility and security
- `package.json` pins Next.js and eslint-config-next at `14.2.31`, React/React DOM at `18.3.1`, and Supabase packages at specific versions.
- No `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, or `yarn.lock` is present on the reviewed main branch.
- CI uses Node 20 and `npm install`, then lint, TypeScript, smoke checks and production build. Without a committed lockfile, transitive dependency resolution is not deterministic.
- An existing dependency-upgrade draft PR (#16) exists; its current state and validation need separate verification. Do not merge dependency upgrades without install, audit, build, auth, marketplace and payment regression tests.
- **Next action:** generate a lockfile on a dedicated branch, review the resolved tree and npm audit output, and run CI/build before choosing supported patched framework versions.

### P1 — Login scope
- `app/login/page.tsx` calls `supabase.auth.signInWithPassword({ email, password })`; this page currently provides email/password sign-in only.
- `app/signup/page.tsx` starts registration using email/password and email callback.
- Phone OTP is not implemented in these pages. Provider/SMS configuration and delivery tests are also not verified in this source-only audit.
- **Next action:** maintain email/password, verify production email delivery and recovery, then implement phone OTP on a separate branch only when SMS provider settings and anti-abuse controls can be tested.

### P1 — Admin logout
- The main-branch admin page header previously exposed navigation to the user dashboard but did not expose a logout action.
- Draft PR #32 adds a server-side Supabase sign-out action and a visible logout button. It still needs CI and authenticated browser verification.

### P1 — Production payment safety
- Existing source and prior review identify payment callback/IPN verification as a launch gate. The source-only audit does not prove live provider configuration or successful reconciliation.
- Keep online payments disabled until server-side validation binds the provider transaction to the stored order, exact amount/currency, expected state, and idempotent processing, with sandbox evidence.

### P1 — Deployment and test evidence
- CI workflow `.github/workflows/ci.yml` includes lint, TypeScript check, smoke checks and production build, but a clean migration replay, comprehensive role authorization matrix, real payment sandbox reconciliation and full authenticated browser E2E are not established by reading this workflow alone.
- Recent preview checks have shown both Vercel and legacy Netlify activity. Confirm whether Netlify is still a required deployment target before removing or ignoring its check.
- **Unknown:** current production database migration state, production auth/SMS/SMTP configuration, payment provider configuration, and end-to-end production health. These require read-only provider inspection or controlled staging tests.

## Current launch classification

| Area | Current evidence | Status |
|---|---|---|
| Email/password login UI | Source found | Implemented in source; end-to-end unverified |
| Phone OTP | Not in login page | Missing/unverified |
| Admin logout | Draft PR #32 | Proposed; not on main |
| Product/admin/marketplace modules | Source exists in repo | Must test complete workflows and permissions |
| Migration replay | Unsupported policy syntax found in migration 013 | Launch blocker until corrected and tested |
| Reproducible dependency install | No committed lockfile found | Launch blocker for reproducible builds |
| Payment reconciliation | Not established by source review | Blocked pending sandbox proof |
| Full role/security test matrix | Not established | Pending |
| Production release readiness | Not established | Not approved |

## Safe next steps

1. Review PR #34's SQL change and replay the entire migration chain in a disposable database.
2. Create a dedicated dependency-baseline PR with a committed lockfile, current security audit, and passing CI.
3. Verify PR #32's logout action through CI and authenticated staging/browser tests.
4. Audit role enforcement, product upload/storage ownership, order transitions, and payment callback logic file-by-file.
5. Inspect provider/deployment state read-only and label anything requiring credentials or owner action as blocked.
6. Prepare a release candidate and ask for explicit production approval only after evidence is complete.

## Production safety

This audit made no production database changes, did not apply migrations, did not merge PRs, and did not deploy production. A source finding is not proof of the current production database or provider configuration.
