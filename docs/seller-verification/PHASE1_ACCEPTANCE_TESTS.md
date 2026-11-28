# Phase 1 Seller Onboarding Acceptance Tests

## Applicant UI
- [ ] Marketplace and Plant Market remain independently selectable.
- [ ] Every Marketplace category has the correct organization type mapping.
- [ ] Every Plant Market category has the correct conditional form fields.
- [ ] Nursery owner requires nursery name and nursery location; hobby gardener does not.
- [ ] Trade license is not universally required.
- [ ] Source declaration, contact, district and consent are visible and validated.
- [ ] Evidence picker clearly states private storage, file types, size and count.
- [ ] Existing application history and review notes remain visible.
- [ ] Query-string preselection works for both legacy URLs.
- [ ] Mobile, keyboard and screen-reader labels are checked.

## API contract
- [ ] Authenticated user is derived from Supabase session.
- [ ] Only Marketplace and Plant Market can submit.
- [ ] Seller category is allowlisted per module.
- [ ] Required/conditional fields are validated server-side.
- [ ] Organization type mapping uses existing database enum values only.
- [ ] Authorized dealer category requires a typed dealer-authorization evidence item.
- [ ] Website accepts HTTPS only when provided.
- [ ] Contact phone, district and source declaration are normalized/length-limited.
- [ ] Consent must be true and server records the policy version and acceptance timestamp.
- [ ] Existing evidence path regex, ownership and object existence remain enforced.
- [ ] Payload remains within current JSONB constraint.
- [ ] Duplicate active/approved application is rejected.
- [ ] Client cannot set status, reviewer, organization ID or module grants.

## Admin Seller Verification Workspace
- [ ] Dedicated Plant Market verification route is protected by the existing Admin layout and `identity.review` capability.
- [ ] Plant Market queue filters only `plant_market`; Marketplace queue filters only `marketplace`.
- [ ] Category chips and category select filter Plant Market seller types without changing other module queues.
- [ ] Nursery name/location, growing model, product types, experience and source declaration are visible in a dedicated review panel.
- [ ] Review checklist flags missing evidence/consent and conditionally checks nursery details for nursery owners.
- [ ] Typed private evidence links are short-lived and remain applicant-path-scoped.
- [ ] Application timeline and review note remain visible.
- [ ] Plant Market and Marketplace review forms carry expected module scope; server action verifies the persisted module and pending status before invoking the RPC.
- [ ] Approve/reject confirmation and duplicate-submit protection remain active.
- [ ] Desktop, tablet and mobile review layouts have no horizontal overflow.

## Authenticated end-to-end QA
- [ ] Disposable local Supabase applies the existing module-access, identity-verification and review-history migrations.
- [ ] Synthetic Admin and two synthetic Plant Market applicants authenticate successfully.
- [ ] Synthetic applicants submit pending Plant Market applications with private evidence and submission events.
- [ ] Admin sees nursery and grower applications only in their matching category filter.
- [ ] Admin approves the nursery and the database records verified gardener profile, global read/create grants and approval event.
- [ ] Admin rejects the grower with a mandatory note; the database records rejected gardener profile, no active seller grants and note-bearing rejection event.
- [ ] Browser QA covers 390, 768, 1024 and 1440px layouts and mobile Admin navigation.
- [ ] Test data and credentials exist only in disposable CI Supabase; no production account or data is used.

## Regression/security
- [ ] Existing legacy application payloads render without new keys.
- [ ] Marketplace and Plant Market grants do not cross.
- [ ] Review RPC remains the only approval path.
- [ ] Rejected application cannot create products.
- [ ] Applicant A cannot read Applicant B's application/evidence.
- [ ] Non-reviewer cannot review or read private evidence.
- [ ] No service-role key or raw identity data is introduced in client code.
- [ ] No production schema/data/permissions are modified.

## Commands
- `npm run test:identity-verification`
- `npm run test:module-access`
- `npm run test:admin-application-management`
- `npm run test:seller-marketplace-submission`
- `npm run test:seller-verification-phase1`
- `npm run test:plant-market-seller-review`
- `npm run test:plant-market-seller-review-supabase` (isolated Supabase E2E job)
- `npm run test:plant-market-seller-review-browser` (authenticated Playwright E2E job)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
