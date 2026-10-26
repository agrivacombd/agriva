# Production Auth and SECURITY DEFINER Review

**Status:** Read-only findings and remediation plan. No Supabase Auth settings, grants, policies, or database objects were changed by this review.

## Scope and evidence

Production-connected Supabase project: `dhqaepsbuwhbynagfxpf` (us-east-1). Findings below were observed through the Supabase Security Advisor on 2026-10-27 and read-only function/grant inspection. This project contains live application data; do not use it as a test environment.

## Auth configuration

- Security Advisor reports `auth_leaked_password_protection` as a warning: leaked-password protection is disabled.
- Enable this in the Supabase Auth password/security settings after checking the current Supabase documentation and communicating the login/signup impact. Verify the setting afterward. Do not change Auth settings from this document alone.

## Anonymous-callable SECURITY DEFINER RPCs

Advisor reported five functions callable by `anon`:

| Function | Initial assessment | Required follow-up |
| --- | --- | --- |
| `get_public_site_settings()` | Returns an allowlist of public site/hero/support/payment-display settings; public access appears intentional. | Confirm returned keys remain strictly allowlisted and contain no private configuration. |
| `record_attribution_session(text,text,uuid,integer)` | Public attribution/session recording; implementation bounds duration and visitor token length and checks an active link. | Confirm rate limiting/abuse controls and that upsert cannot overwrite another visitor's attribution. |
| `resolve_reseller_attribution(text,text,uuid)` | Returns limited attribution identity/expiry for matching code/token/product/session. | Confirm token entropy, expiry checks, and no personal data disclosure. |
| `resolve_reseller_link(text)` | Resolves an active link to product/expiry details. | Confirm output is intentionally public and only exposes public product metadata. |
| `track_search(text,text)` | Records a bounded/cleaned search query and caller-provided session identifier. | Confirm length/rate limits, session identifier handling, retention, and spam controls. |

Do not revoke these public RPC grants blindly: some are part of public browsing or attribution flows. Before any change, trace all callers, decide the intended public contract, test the new grants/policies on an existing non-production environment if one is available without cost, and use a reviewed forward-only migration with rollback guidance.

## Authenticated-callable SECURITY DEFINER RPCs

Security Advisor reports 28 functions callable by `authenticated`. This is a warning class, not proof of a vulnerability: some functions intentionally implement privileged workflows and enforce authorization inside the function. Review each function's body, `search_path`, EXECUTE grants, and caller path. Confirm every admin RPC independently checks a trusted server-controlled role (for example, profile role or app metadata); never rely on user-editable `user_metadata`. Keep fixed search paths and least-privilege grants.

## Confirmed payment-event RPC grant state

Read-only inspection confirmed `public.record_payment_event(uuid,text,text,numeric,text,text,jsonb)` is SECURITY DEFINER with fixed `search_path = pg_catalog, public, pg_temp`; `anon` and `authenticated` cannot execute it, while `service_role` can. This matches the least-privilege intent of the repository migration. Do not apply that migration to Production merely to align migration history; the broader migration drift is tracked in issue #65.

## Release gates

1. Identify and confirm the Production target before any settings or SQL changes.
2. Verify current Supabase Auth settings and document the before-state.
3. Enable leaked-password protection only after reviewing signup/login impact; then verify the resulting setting.
4. Trace and test each public RPC before changing grants.
5. Reconcile migration history and schema drift under issue #65 before applying any database migration.
6. Never create paid resources, staging branches, test accounts, or test transactions for this review.

## Advisor references

- [Supabase database linter: anonymous SECURITY DEFINER functions](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Supabase database linter: authenticated SECURITY DEFINER functions](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Supabase Auth password security](https://supabase.com/docs/guides/auth/password-security)
