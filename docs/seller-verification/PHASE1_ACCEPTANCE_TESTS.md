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
- [ ] Consent must be true.
- [ ] Existing evidence path regex, ownership and object existence remain enforced.
- [ ] Payload remains within current JSONB constraint.
- [ ] Duplicate active/approved application is rejected.
- [ ] Client cannot set status, reviewer, organization ID or module grants.

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
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
