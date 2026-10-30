# AGRIVA Module Access and Identity Verification

## Identity model
Signup/profile role selections are descriptive personalization only. They never grant seller permissions. Plant Market and business Marketplace selling require their respective applications, admin review, and active module grants. Sell Harvest is intentionally different: any authenticated user may create their own harvest listing directly; farmer identity verification and a Sell Harvest grant are not prerequisites.

## Seller application paths
- Plant Market: hobby/ornamental gardener application; admin approval creates a verified \`gardener_profiles\` record and global \`plant_market\` grants.
- Marketplace: company/shop/dealer application; approval verifies the applicant-owned organization and creates organization-scoped \`marketplace\` grants.
- Sell Harvest: no seller-verification application is required for direct posting. Any logged-in user may create an owner-scoped harvest listing; admin moderation controls publication.
- Buyer Demands remain available to authenticated users without seller verification.

## Evidence handling
Evidence uploads go to the private \`identity-verification\` Supabase Storage bucket, under a folder named for the authenticated user ID. Accepted file types are JPG, PNG and PDF, with a 5 MB per-file limit and up to five files per application. Admin pages generate short-lived signed links only for paths under the applicant's own folder. Evidence objects are not public. The application INSERT RLS policy also calls a database helper that verifies each referenced object exists under the authenticated applicant's own folder; bypassing the web form does not bypass this check.

## Review and audit
Admins review applications at \`/admin/identity-verification\`. The page calls \`admin_review_module_application\`; it does not directly update application state. The review RPC, grant creation, organization verification and verification-profile synchronization run transactionally. \`module_access_application_events\` records submission and review outcomes. Client users cannot update review state or insert grants.

## Channel and backend enforcement
- Products now carry \`marketplace_channel\` (\`plant_market\` or \`marketplace\`).
- Plant Market catalogue reads only the Plant Market channel; business Marketplace reads only the Marketplace channel.
- Product INSERT/UPDATE/DELETE has restrictive RLS policies requiring a matching module grant, so older permissive role-based policies cannot grant seller access.
- Harvest listing INSERT/UPDATE remains owner-scoped for authenticated users; direct posting does not require a farmer profile or Sell Harvest grant. Admin moderation protections remain in force.
- API routes independently check the authenticated session and module grants.

## Rollout sequence
1. Run the static regression checks and type/lint/build checks on this branch.
2. Apply both module-access migrations only to an isolated Supabase test project.
3. Run RLS integration tests for anonymous access, self-approval, self-grant, cross-user evidence paths, pending/rejected/approved states, expired/revoked grants, channel isolation and harvest ownership.
4. Confirm existing product data defaults to the business Marketplace channel; reclassify any known hobby-gardener listings only after an audited owner review.
5. Only after tests and data review, prepare a production rollout plan. No production database, secrets, deployment or main branch changes are part of this feature branch.

## Important
The branch is not production-ready until migrations have been applied and tested in an isolated project. Existing seller/harvest code outside the routes explicitly integrated here must be inventoried before production rollout. Do not infer that a signup role means a verified seller.
