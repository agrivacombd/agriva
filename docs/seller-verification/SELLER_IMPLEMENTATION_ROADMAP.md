# Seller Verification Implementation Roadmap

## Phase 0 — Audit and architecture (current)

Deliverables:
- Architecture, requirements, permission, migration, security-risk and roadmap documents.
- Existing route/API/table/RPC/Storage/RLS inventory.
- PR/branch dependency map.
- No schema mutation, production data mutation or deployment.

Exit gate: docs reviewed, current branch/PR #410 reconciled, and unresolved schema/permission questions assigned.

## Phase 1 — Contract and UX specification

- Confirm seller categories and conditional document matrix with product/legal owner.
- Define versioned payload schemas for Marketplace and Plant Market.
- Define typed evidence metadata and upload limits.
- Specify wizard steps, field-level help, save/resume, validation and status timeline.
- Specify Admin queues and reviewer capability boundaries.
- Confirm whether OTP is already verified by account auth; do not add duplicate OTP flow.
- Decide NID/selfie provider and manual fallback; if undecided, keep this out of scope.
- Produce testable acceptance criteria and accessibility checklist.

Exit gate: approved requirements and no unresolved sensitive-data processing decisions.

## Phase 2 — Shared onboarding UI

- Refactor existing route progressively; preserve query-parameter compatibility.
- Add seller category selection and market-specific dynamic fields.
- Add typed document checklist and per-file status.
- Add address hierarchy and delivery coverage fields.
- Add save/resume only if persistence is designed safely.
- Keep current submission endpoint contract compatible during transition.

Exit gate: component tests, form validation tests, responsive/keyboard QA and no regression to existing applicants.

## Phase 3 — API, evidence and data contracts

- Add server-side Zod/schema validation (or existing project-standard validator).
- Validate MIME signature, file size/count and object ownership.
- Store document type and metadata safely; keep bucket private.
- Add duplicate submission idempotency and rate limits.
- Add data minimization, retention and deletion workflow.
- Do not store NID images/values unless approved by legal/security and operational review.

Exit gate: API integration, RLS and Storage isolation tests pass.

## Phase 4 — Admin verification workspace

- Add separate Marketplace and Plant Market filters/queues using shared review component.
- Show identity, business and product-category checks separately.
- Add evidence checklist, reviewer notes, rejection reason and explicit confirmation.
- Add “request more information” only with a server-supported state transition.
- Add reviewer capability enforcement, evidence access audit and risk escalation.
- Keep seller permission manager separate from application decision UI.

Exit gate: authenticated Admin workflow QA and audit verification.

## Phase 5 — Trust and seller lifecycle

- Distinct badges: Identity Verified, Business Verified, Nursery Verified, Marketplace Seller and Plant Market Seller.
- Re-verification reminders and document expiry handling.
- Suspension/revocation and reinstatement with reason and audit.
- Complaint/return metrics only after reliable transaction data exists.
- Risk score explainable to authorized reviewers; never auto-reject solely on opaque score.

Exit gate: policy review, false-positive/appeal testing and permission regression.

## Phase 6 — Production readiness

- Full-schema isolated staging with synthetic users and applications.
- Test applicant, reviewer, non-reviewer, cross-user and dual-market cases.
- Lint, TypeScript, regression, build, migration replay, RLS, Storage and browser tests.
- Full route-level responsive and visual review.
- Exact-SHA Preview and independent review.
- Migration preflight and explicit production approval.
- Roll out additive schema first, then application code; monitor and verify.

## Dependencies and constraints

- Existing Identity Verification migration and module-access foundation.
- Merged PR #406 shared Admin application management.
- Open PR #410 Admin Control Center changes; do not assume it is merged or its latest code CI-green.
- Existing Marketplace organization model and Plant Market gardener profile.
- Existing module grant/RLS enforcement and product APIs.
- Vercel preview quota and isolated Supabase environment availability.

## Phase 1 recommendation

Start with a code/schema contract reconciliation, not a new database table. Confirm the current SQL function and trigger definitions, all RLS policies, the complete UI field contract, and all product mutation routes. Then approve the typed requirements schema and implement the wizard in small, tested increments.
