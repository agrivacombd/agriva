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
