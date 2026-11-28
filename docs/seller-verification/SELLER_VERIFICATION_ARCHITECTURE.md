# AGRIVA Seller Verification Architecture

**Phase:** 0 — audit and architecture  
**Baseline:** `main` at `753d90f2c45bdb1302ee3c9357ff68c0593d28aa`  
**Scope:** Marketplace + Plant Market seller onboarding, identity evidence, business/nursery review, module approval and seller access.

## 1. Executive decision

Extend AGRIVA's existing module-access and identity-verification workflow. Do not introduce a parallel seller-approval system.

The target design is:

- One authenticated account and shared identity/evidence foundation.
- Independent applications and decisions for `marketplace` and `plant_market`.
- Reuse `module_access_applications`, `user_module_grants`, `organizations`, `gardener_profiles`, `module_access_application_events`, and `admin_review_module_application`.
- Preserve the current distinction between organization-scoped Marketplace access and global Plant Market access.
- Keep product creation blocked until the relevant server-side grant and domain verification state are both valid.
- Keep Admin review, grant issuance, revocation and audit on trusted server/database paths.

## 2. Verified current implementation

### Applicant route and API

- Applicant UI: `app/account/verification/page.tsx`.
- API: `app/api/identity/applications/route.ts`.
- Shared server authorization: `lib/authz/module-access.ts`.
- Marketplace product creation: `app/api/seller/products/route.ts`.
- Plant Market product creation: `app/api/plant-seller/products/route.ts`.

The UI currently supports the two seller modules and shows application status/history. Plant Market currently asks for district, one gardening type and an experience note. Marketplace currently asks for organization name/type, optional trade-license/registration number, business address and optional website. Both collect up to five generic private evidence files.

The API accepts new applications only for `plant_market` and `marketplace`. It binds the applicant to `auth.getUser()`, validates user-owned evidence paths and file existence, prevents another pending/under-review/approved application for the same user/module, and inserts a pending `module_access_applications` row. Rejected applications can be resubmitted.

### Existing data and approval path

- `module_access_applications`: source of truth for submitted module applications.
- `user_module_grants`: source of truth for module permissions.
- `organizations`: Marketplace business identity and verification status.
- `gardener_profiles`: Plant Market gardener verification profile.
- `module_access_application_events`: append-only application lifecycle history.
- `admin_review_module_application`: transactional, row-locked Admin decision RPC.
- `identity-verification` Storage bucket: private, user-folder-scoped evidence storage.

Approval is not a frontend state change. The database review function and status-sync trigger update the domain verification state and issue/activate grants. Marketplace grants are organization-scoped; Plant Market grants are global.

### Admin review

PR #406 is merged and adds the shared `components/admin/ApplicationManagement.tsx`, Identity Verification queue and a Marketplace-only Seller Applications queue. The Seller Applications scope filters `module = marketplace`; Plant Market is currently reviewed through the Identity Verification queue. It must not be assumed that the label “Seller Applications” already covers both markets.

PR #410 is open on `feat/admin-dashboard-premium-redesign`. It adopts the shared Admin design system and improves Application Management UI, including confirmation controls. It is not merged into `main`; its latest code changes have a fresh-CI/Preview evidence gap described in the PR. Do not base this Phase 0 documentation branch on that unmerged candidate.

## 3. Target architecture

```text
Authenticated AGRIVA Account
          |
          v
Shared Seller Application Hub
          |
          +---------------------------+
          |                           |
          v                           v
Marketplace Application       Plant Market Application
Organization-scoped           Global gardener/nursery access
          |                           |
          +-------------+-------------+
                        |
                        v
             Shared Identity Evidence
             (private, access-controlled)
                        |
                        v
             Admin Review / Risk Checks
                        |
                        v
          Transactional approval RPC + audit
                        |
             +----------+----------+
             |                     |
             v                     v
       Marketplace grant      Plant Market grant
       organization scope     global scope
             |                     |
             v                     v
       Marketplace API        Plant Market API
       + RLS guards            + RLS guards
```

## 4. Application lifecycle

Supported lifecycle states: `draft` (client/local or persisted only if an existing draft mechanism is found), `pending`, `under_review`, `approved`, `rejected`, `withdrawn`, and operational access state `suspended`/expired where supported by the grant model.

Only trusted server/database operations may transition review state. Approval and rejection must use the existing transactional RPC. “Request changes” must be designed as an explicit supported transition before UI exposure; do not simulate it by overloading rejection. Suspension/revocation is an access-control action and must be distinct from historical application rejection.

## 5. Applicant experience

Use a progressive, accessible wizard with shared sections:

1. Select market.
2. Select seller category.
3. Applicant/contact and address information.
4. Identity evidence (only fields that can be lawfully and securely processed).
5. Market-specific business/nursery profile.
6. Category-specific supporting documents.
7. Delivery, returns and payout declarations.
8. Review, policy consent and submit.

Preserve existing route compatibility:
- `/account/verification`
- `/account/verification?module=marketplace`
- `/account/verification?module=plant_market`

The query parameter selects the market; server validation remains authoritative. Do not require every individual grower to possess a trade license. Use conditional requirements based on seller type, product category and applicable law.

## 6. Admin experience

Retain the existing Identity Verification and Seller Applications routes and shared review service. Add a clear market filter / Plant Market queue entry without duplicating decision logic. Each application detail should expose:
- Applicant and market category.
- Required vs optional evidence checklist.
- Secure, short-lived evidence access.
- Review history and prior decisions.
- Risk flags with evidence and explanation.
- Approve / reject / request-more-information only when backed by a valid server transition.
- Explicit confirmation, mandatory rejection reason, loading/error/success feedback.
- Least-privilege reviewer capability and append-only audit.

## 7. Non-functional requirements

- RLS and server authorization are the enforcement boundary.
- No client-supplied user ID may determine the applicant or reviewer.
- No public bucket or permanent public URL for identity documents.
- No service-role key in browser code.
- No full NID number in logs, analytics or ordinary Admin tables.
- Idempotent submissions and transactional approval.
- Backward-compatible rollout with no weakening of existing product RLS.
- Responsive, keyboard accessible UI and WCAG 2.2 AA contrast review.
- Observability must not expose identity-document content.

## 8. Phase 0 exit criteria

This architecture is ready for Phase 1 planning when the requirements, permission, migration and risk documents in this directory are reviewed against the current branch and the open PR #410 is reconciled. No schema or production mutation is authorized by this document.
