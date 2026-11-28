# Seller Verification Security Risk Register

**Rating:** Initial design assessment; re-score after implementation and threat modelling.

| ID | Risk | Severity | Current observation | Required mitigation / gate |
|---|---|---|---|---|
| SV-01 | Generic evidence upload mistaken for verified NID/identity | High | Current UI accepts generic evidence files; no structured NID/selfie flow | Label current state accurately; add provider/manual verification design before claiming identity-verified |
| SV-02 | Sensitive NID/selfie exposure | Critical | Private bucket and applicant-folder checks exist | Least-privilege reviewer access, short-lived signed URLs, encryption, access audit, no logs, retention/deletion policy |
| SV-03 | Duplicate / fraudulent identity | High | Open application uniqueness exists per user/module | Cross-account duplicate checks only via privacy-safe keyed fingerprint/provider; manual review and appeal path |
| SV-04 | Marketplace and Plant Market permission crossover | Critical | Distinct scopes and APIs exist | Independent module decisions; test that one grant never unlocks the other |
| SV-05 | Legacy RLS policy bypass | Critical | Restrictive product guards exist in identity migration | Preserve restrictive policies; run RLS regression against every legacy permissive policy |
| SV-06 | Client-side self-approval or grant escalation | Critical | Client grant writes are revoked; review uses RPC | Keep all grants/review state server/database-only; test anon/authenticated direct SQL/API denial |
| SV-07 | Organization ownership / scope confusion | High | Marketplace is organization-scoped | Verify owner/member authority and exact organization UUID in every API/RPC |
| SV-08 | Generic evidence type cannot prove category compliance | High | Up to five generic JPG/PNG/PDF uploads | Typed document requirements and per-document review state |
| SV-09 | Insecure upload validation (extension/MIME mismatch) | High | UI and API validate extension/path; deeper content validation not established by Phase 0 | Verify file signature, malware scanning strategy, size/count, safe preview and download headers |
| SV-10 | Application state race / duplicate review | High | RPC uses row lock and accepts pending/under_review | Concurrency tests; unique index and idempotent response |
| SV-11 | Over-collection / retention breach | High | Existing evidence storage has no retention details in reviewed route | Data minimization, retention schedule, deletion workflow and legal hold |
| SV-12 | Unclear request-more-info workflow | Medium | Existing states do not establish a distinct changes-requested transition | Add explicit state/event, actor and resubmission rules before UI |
| SV-13 | Admin reviewer overprivilege | High | Existing shared queue requires identity.review; exact reviewer separation needs RBAC reconciliation | Separate capabilities and scoped evidence viewing; no broad fallback |
| SV-14 | False trust badge / misleading verification label | High | Current UI says identity and seller access in one workflow | Separate Identity, Business/Nursery and Seller Access badges; show what was checked |
| SV-15 | Seller evidence exposed in audit/log/search | Critical | Review data includes applicant payload and evidence path metadata | Redact sensitive fields; audit metadata only; no raw document content or permanent signed URLs |
| SV-16 | Product approval bypass through alternate API | Critical | Marketplace and Plant Market product APIs check server access; RLS guards exist | Inventory all create/update/bulk/import paths and verify each gate |
| SV-17 | Payout fraud / wrong beneficiary | High | Payout verification not part of current seller application | Verify account ownership before first payout; MFA for sensitive changes; never request PIN/OTP |
| SV-18 | Regulatory / legal overreach | High | Document requirements vary by activity and product | Legal review of NID processing and regulated product categories; conditional document matrix |
| SV-19 | Reviewer action without adequate evidence | Medium | Review note and evidence links exist | Checklist, reason codes, escalation, second review for high-risk cases |
| SV-20 | Stale preview / unverified release | High | PR #410 notes exact-SHA Preview and fresh CI gaps | Gate release on CI and Preview for exact reviewed SHA; no stale preview sign-off |

## Immediate P0 gates

1. No public identity evidence storage.
2. No client-side grant writes or review-state updates.
3. Independent Marketplace and Plant Market authorization tests.
4. No raw NID/selfie in logs, analytics or broad Admin list payloads.
5. Reviewers see evidence only when authorized and access is audited.
6. Every product-write path must enforce the corresponding market grant server-side and at the database layer.
7. Do not introduce NID/selfie collection until lawful basis, consent, provider/manual review, retention and breach response are approved.
