# Admin Interaction & Visual Review

**Reviewed candidate:** `feat/admin-dashboard-premium-redesign`  
**Latest previously tested visual candidate:** `5177880c2f76bf16a4993c3ce0458f502016e78e`  
**Current interaction-fix candidate:** `806f98bdef79f662c3a6310f88f45aeca4c6d3db` (new CI verification pending)  
**Latest CI:** AGRIVA CI #4154 — PASS; Plant Market Release Gate #232 — PASS.

## Evidence boundary

This document separates source inspection and isolated CI browser evidence from live Preview visual verification.

- CI run #4148 passed on the earlier candidate and uploaded only login plus Command Center screenshots.
- Those Command Center screenshots were visually inspected at 390px and 1440px.
- Latest CI #4154 completed successfully and generated 124 full-page route screenshots: 31 rendered Admin pages × 4 widths (390, 768, 1024, 1440px). All responsive overflow assertions passed. The 32nd route entry is the legacy article detail URL, which correctly canonical-redirects to the article queue.
- The latest exact commit does not have a READY Vercel Preview. The prior Preview at `fb3adbbf` reached READY, but it is not the latest source SHA. Vercel Git deployment checks for the latest SHA report the free build-rate limit; the direct deployment API also returned `api-deployments-free-per-day` HTTP 402. No exact-SHA Preview visual sign-off is claimed.
- Important fixture limitation: CI starts an isolated Supabase stack and applies only the buyer-demand/RFQ fixture plus Admin P0 fixture/migrations; it does not apply the full AGRIVA application schema or seed realistic rows for every Admin module. Consequently, several screenshots intentionally show module-level schema/permission error states or empty lists. These screenshots validate layout and error presentation, not populated production-like records, event timelines, or full mutation workflows.

## Visual observations from available Command Center screenshots

1. At 390px the content stacks cleanly, KPI cards remain two columns, approval queues stack, and workspace shortcut cards wrap without horizontal overflow.
2. At 1440px the left navigation and content workspace form a coherent two-column shell; dashboard cards and shortcut groups align consistently.
3. **Fixed in source:** the hero greeting and footer previously exposed the email local-part, which appeared as a long synthetic/internal identifier. The greeting now uses `user_metadata.full_name` or `Admin`, and the footer no longer prints the email.
4. **Fixed in source:** long topbar labels are abbreviated at mobile widths (for example, “Command Center” becomes “Command”) instead of truncating to `Comman...`.
5. Small metadata/helper text is visually low-emphasis. Contrast should be checked against WCAG 2.2 AA in the exact Preview, not inferred from screenshots alone.

## Workflow-by-workflow source review

| Module | Controls / states found in source | Review findings |
| --- | --- | --- |
| Marketplace Products | GET filters; per-product edit forms; error and empty states | Core filtering/edit path exists. Exact filter interaction, long product names, image/editor states and save feedback still need Preview QA. |
| Categories | Create/edit forms; error and empty states | No explicit confirmation flow found for save; inspect keyboard validation and narrow form wrapping in Preview. |
| Green Exchange | Approve/reject/return-to-review actions; error and empty states | Mutations are direct form actions with no client confirmation. Check card wrapping, action grouping and resulting notices in Preview. |
| Orders & COD | Status filter links; order transition form; COD collection form; collection event history; error and empty states | No explicit confirmation before order status mutation or COD collection record. COD form is permission-gated, but a double-submit/duplicate-entry prevention UX check is still required. No order search control found in this page. |
| Custom Orders / RFQ | Request moderation, quote approval/rejection, wholesaler invitation/verification, item and fulfillment transitions | Multiple state-changing forms; no explicit confirmation or loading feedback found. Empty state is not explicit. Review status-specific transition choices, long request cards and multi-item/quote layouts. |
| Seller Applications | Status counters/filters, applicant search, private evidence links, review history timeline, approve/reject form | Server action enforces a rejection note of at least 5 characters. UI placeholder says required, but client-side validation/inline guidance is weak; approve/reject has no confirmation step. Evidence links use short-lived signed URLs. |
| Identity Verification | Status counters/filters, applicant search, private evidence links, history timeline, approve/reject | Same review controls as Seller Applications. Validate long evidence/detail fields and timeline scrolling at mobile widths. |
| Seller Access Control | Marketplace/Plant Market tabs, refresh, inline revoke confirmation, mandatory 10–500 character reason, loading/error/empty/success states | Strongest confirmation UX in the reviewed set. Verify focus handling and screen-reader announcement of the inline confirmation panel in Preview. |
| Access Control catalogue | Role/capability catalogue and active assignment review | Explicitly read-only; no role grant/edit controls. Ensure this read-only scope is clear so operators do not mistake it for a permission editor. |
| Transport | Partner review actions (approve/reject/suspend), status navigation, error/empty states | Direct mutation actions have no explicit confirmation. Check status filter retention and application card wrapping. |
| Jobs | Status filter navigation; moderation note; publish/reject/pause/filled actions; error/empty states | Direct moderation actions have no confirmation. List is capped at 100 and has no visible pagination. Verify notes and action buttons wrap on 390px. |
| Content Drafts | Status/type filters, keyword search, editor, revision timeline, loading/error/notice states | Publish uses a native confirmation; other workflow transitions do not. Review editor focus, timeline expansion, filter persistence and disabled/busy behavior. |
| SEO Landing Pages | Create/edit form, FAQ add, draft/review/approve/publish/unpublish actions | **Addressed in current candidate:** explicit initial loading and empty states, refresh/retry, safe JSON/error handling, caught network failures, `finally` cleanup for busy state, success notices, and confirmation before publish/unpublish. Exact-SHA Preview interaction verification remains pending. |
| Seed Information | Common section, crop guide and product seed-detail forms; delete actions | **Partially addressed in current candidate:** destructive delete actions now require a native confirmation, and explicit empty states explain how to create the first common section or crop guide. Existing query-error warning remains. Mutation feedback and exact-SHA Preview verification remain pending. |
| Settings / Growth Tracking | Site settings forms and integration ID/token forms with validation notices | No confirmation before toggling a provider to enabled. The privacy copy correctly states configuration-only behavior; verify saved/disabled states and error recovery. |
| Reports | Aggregated report cards and export links; error notice | Data is limited to the latest 5,000 rows; errors collapse report metrics into a warning. Verify export filename/content and partial-data messaging. |
| Finance | Read-only payout queue and commission ledger; error/empty states | Metrics are based on limited recent records and are labelled as non-reconciled. Verify table overflow, currency formatting and empty/loading states. |
| Audit Log | Read-only latest 100 events; error/empty states | No search/pagination control found. Verify metadata wrapping and long actor/event values. |
| Content Studio / Growth Intelligence / Demand Intelligence | Primarily read-only dashboards, links and brief-generation controls | Verify metric unavailable states, charts, long labels and downstream navigation. |

## Prioritized follow-up

### P1 — fix before release sign-off
- **Implemented, pending CI/Preview verification:** robust loading/error/retry states and publish/unpublish confirmation for SEO Landing Pages.
- **Implemented, pending CI/Preview verification:** delete confirmation and explicit empty states for Seed Information; add clearer per-action busy/success feedback if the Preview walkthrough exposes ambiguity.
- Add confirmation/anti-double-submit UX for COD collection and sensitive order/fulfillment/moderation transitions.
- Make rejection reason requirements visible and validated inline before submitting application rejection.
- Add explicit empty states to Custom Orders and consistent loading feedback to server-action-heavy workflows.

### P2 — polish / usability
- Prevent Command Center topbar title truncation at 390px (short mobile title or responsive title layout).
- Add pagination or explicit “latest N records” and a search/filter path where operators need to work beyond the current 100/500-row limits.
- Add confirmation for SEO page publish/unpublish and other irreversible workflow transitions.
- Check contrast of muted helper text, focus order, dialog semantics, keyboard-only workflows and reduced-motion behavior.

## Release gate

The source audit is useful for finding likely UX risks, but it is not a substitute for visual review of the exact deployed build. Final acceptance requires:
1. Latest CI and Plant Market gate green, including route screenshot artifact generation.
2. Inspect every generated route screenshot at all four breakpoints.
3. Exact-SHA Vercel Preview READY.
4. Authenticated browser walkthrough of filters, forms, dialogs/confirmations, timelines, empty/error/loading states and bulk RFQ transitions using synthetic staging data.
5. Independent reviewer approval on the same exact SHA.

No production data or production schema was changed during this review. The current interaction-fix candidate is not yet CI-verified or deployed.


## Sensitive-action confirmation and duplicate-submit hardening — current candidate

**Candidate:** `c8fbd67f30d9c08788d03f86ac8d72912689c20c` (CI / exact Preview verification pending).

- Added shared `AdminConfirmSubmitButton` for privileged state-changing forms. It preserves submitter name/value, runs native form validation, asks for explicit confirmation, locks repeat clicks with a ref, disables while busy, and displays a processing label.
- Orders: order delivery status transitions and COD collection ledger writes now require confirmation and are guarded against repeated clicks.
- Custom Orders/RFQ: request open/close/cancel, quote approve/reject, wholesaler verification/invitation and fulfillment transitions require confirmation and single-submit locking.
- Seller Applications and Identity Verification: approve/grant and reject actions require confirmation; rejection requires a non-empty review note inline before confirmation.
- Green Exchange: approve/reject/return-to-review actions require confirmation.
- Transport: verify/reject/suspend actions require confirmation.
- Jobs: publish/reject/pause/filled moderation actions require confirmation.
- Added `scripts/smoke-admin-sensitive-actions.mjs` and `test:admin-sensitive-actions`, wired into CI.

**Scope note:** This is client-side duplicate-click protection and explicit confirmation UX. Server-side authorization, RPC transition validation, and transactional audit remain the security boundary; no new idempotency-key/database schema was introduced. Full authenticated workflow QA remains required.

**Verification:** The current SHA has no PR-triggered GitHub Actions run reported yet. The only combined status currently reported is Vercel `build-rate-limit`; that is a deployment quota blocker, not a successful build or test. Earlier green CI applies only to the earlier SHA. No production migration, merge or deployment was performed.


## Release candidate verification update — 2026-11-29

**Verified head at review:** `9008a1a4e04fc6d9683897a51f30d2ea35994996`.

- AGRIVA CI run #4173 (`46180086634`) is **completed / success**. Both the `quality` job and the isolated Supabase Auth + PostgREST integration job completed successfully. The quality job includes lint, the Admin authorization/P0/control-center/sensitive-action regressions, production build and route/browser checks.
- Plant Market Release Gate #251 (`46180086696`) is **completed / success**, including TypeScript and production build.
- The shared sensitive-action confirmation control is now covered by the successful exact-head CI run. It is client-side duplicate-click protection only; server-side authorization and transactional RPC/audit remain the security boundary.
- Vercel has **no Preview deployment record** for this exact SHA. The project previously returned `api-deployments-free-per-day`; do not treat an earlier commit's Preview as evidence for this candidate.
- PR #410 remains open and mergeable. Independent reviewer approval is still outstanding.

### Remaining release work

1. Obtain independent security/UX approval against the exact PR head.
2. Generate a Vercel Preview for the exact final SHA once the free deployment quota resets; verify its commit metadata before testing.
3. Run authenticated synthetic-data walkthroughs on that Preview for every sensitive action, filter, drawer, timeline, bulk RFQ workflow, and settings/provider toggle. CI's isolated schema does not contain realistic populated fixtures for every module.
4. Inspect the complete route screenshot artifact at 390, 768, 1024 and 1440px; separately complete keyboard, screen-reader, focus, contrast and reduced-motion checks.
5. Complete production migration/release review and rollback plan. Production migrations, merge and deployment remain unperformed and require explicit release authorization.

### Scope corrections

- Orders/COD, Custom Orders/RFQ, Seller Applications, Identity Verification, Green Exchange, Transport and Jobs now use the shared confirmation/duplicate-click guard. This supersedes earlier findings that these actions had no confirmation.
- SEO Landing Pages loading/error/retry and publish/unpublish confirmation, plus Seed Information delete confirmation and empty states, are implemented and included in the successful CI candidate. Exact Preview interaction review is still outstanding.
- Settings/provider enable confirmation, complete populated-data workflow QA, formal accessibility review, and operator-scale pagination/search remain follow-up items.


## Admin Settings confirmation hardening — latest follow-up

- Growth & Tracking configuration saves now use the shared confirmation and duplicate-submit guard.
- General site-setting saves also use the guard; boolean platform settings (including COD and online-payment switches) receive an explicit high-impact confirmation prompt.
- Added the Settings page to `test:admin-sensitive-actions` so CI checks that the guarded control is adopted.
- Current branch head at this follow-up: `8a35d4085be762ba695cef35c4d0f1a451eca9f0`.
- CI for this exact head is running; do not treat the earlier #4173 result as validation of this new Settings change.
- Exact-SHA Preview, populated authenticated workflow QA and accessibility review remain pending.


## Latest exact-head verification and screenshot review — 2026-11-29

**Verified application SHA:** `efdb78b2d5df9685256a3239c32833aa32622eca`  
**AGRIVA CI:** #4188 (`46181308056`) — completed / success.  
**Plant Market Release Gate:** #257 (`46181308073`) — completed / success.

- The AGRIVA CI `quality` job passed dependency checks, lint, TypeScript, Admin authorization/P0/control-center/sensitive-action regressions, and the production build.
- The isolated Supabase Auth + PostgREST integration job passed, including the Admin P0 migration fixture.
- The Plant Market gate passed its release contract smoke test, TypeScript check and production build.
- The CI browser job uploaded `agriva-browser-qa-evidence` (18.1 MB; SHA-bound artifact) containing 124 route screenshots: 31 rendered Admin pages × 4 viewports (390, 768, 1024, 1440px), plus login and Command Center evidence. The legacy article-detail URL is a canonical redirect, not a separately rendered page.
- First-pass visual contact-sheet review of the 390px and 1440px route matrices shows a consistent shell and responsive page canvas. The screenshot evidence is useful for layout/overflow review, but many modules show empty or query/schema/permission error states because the isolated CI database does not seed realistic records for every Admin module. It does not prove populated-data UX or successful mutations.
- The CI browser job also passed authenticated route smoke, mobile drawer search/close, desktop navigation visibility, unauthenticated RFQ API rejection, and zero uncaught browser runtime errors. Its explicit layout assertions passed at all four viewport widths.
- **Settings confirmation follow-up is included in this exact-head CI:** the sensitive-action regression checks the Settings page adoption and confirmation text.

### Superseding earlier review notes

- Earlier sections that say the sensitive actions lack confirmation are historical findings. Orders/COD, Custom Orders/RFQ, Seller Applications, Identity Verification, Green Exchange, Transport and Jobs now use the shared confirmation and duplicate-click guard.
- Earlier notes that Settings/provider saves lack confirmation are superseded: Growth & Tracking configuration and general site settings now use the shared guard; boolean platform settings receive an explicit high-impact confirmation.
- Earlier CI #4173/#4154 references are historical. The latest verified application SHA is `efdb78b...`, with #4188 and #257 green.

### Still open — do not mark release-ready yet

1. **Exact-SHA Preview:** Vercel has no deployment record for `efdb78b...`; no current Preview URL/commit metadata exists. Previous free daily deployment quota failures remain the known blocker.
2. **Populated authenticated QA:** CI fixtures do not contain realistic rows for every module. Orders/COD, RFQ quote lifecycle, Seller Applications, Identity Verification, Seller Access revocation, Green Exchange, Transport, Jobs, Content Drafts, SEO pages, Settings and Finance need synthetic populated-data walkthroughs on an exact-SHA Preview or dedicated staging.
3. **Formal accessibility:** keyboard-only end-to-end review, screen-reader announcements, focus restoration/trapping across dialogs and drawer, contrast measurement against WCAG 2.2 AA, and reduced-motion behavior are not yet evidenced by an accessibility audit.
4. **Independent review:** no independent PR review submission is currently recorded for PR #410.
5. **Release controls:** production migration/rollback review and explicit release authorization remain outstanding. No production migration, merge or deployment has been performed.



## Custom Orders empty-state follow-up — latest branch change

- Application commit: `73d672c07f403061dee542306cb548495e00c928`.
- Added the shared `AdminEmptyState` when the Bulk RFQ request query succeeds with zero rows. The Bengali copy explains that RFQs created from buyer demand will appear here for review, wholesaler invitation and quotation workflows.
- Added a regression assertion in `scripts/smoke-admin-sensitive-actions.mjs`; test commit: `98bb2b5f7a1220d314986d63521aa790eac5d51d`.
- This change is newer than CI #4188 / Plant Market Gate #257. Fresh CI is required; the connected PR workflow feed currently reports no run for the latest branch head. Do not claim this follow-up is tested.
- This empty state only handles a successful zero-row result. Query failures continue to use the existing `AdminErrorState`.
