# Phase 1 — Seller Onboarding Contract & UX Specification

**Implementation branch:** `feat/seller-verification-phase1`  
**Base:** `feat/admin-dashboard-premium-redesign`  
**Phase 0 review:** [PR #412](https://github.com/agrivacombd/agriva/pull/412) remains separate and open for review.  
**Scope:** Contract and UX specification plus safe, additive application-layer implementation. No database migration or production write.

## 1. Goals and non-goals

### Goals
- Expand the existing seller application wizard for Marketplace and Plant Market.
- Preserve existing routes, query parameter, application table, evidence bucket, review RPC, audit events and module grants.
- Capture seller category and category-specific declarations in the existing `applicant_data` JSONB payload.
- Enforce all required fields and allowlisted category values on the server, not only in browser validation.
- Keep Marketplace organization-scoped and Plant Market global.
- Make required, conditional and optional evidence understandable.
- Preserve legacy applications and history.

### Non-goals in this phase
- No new tables, columns, enums, RPCs, triggers or RLS policies.
- No structured NID number capture, NID front/back capture, selfie/liveness or face matching. The current upload is generic private supporting evidence and must not be described as identity verification completed.
- No automated business-license or nursery-registry lookup.
- No payout account capture or payment-provider integration.
- No new approval status or request-more-information transition.
- No automatic approval, risk-based rejection or trust badge.
- No production Supabase mutation or deployment.

## 2. Existing contract to preserve

### Routes
- `/account/verification`
- `/account/verification?module=marketplace`
- `/account/verification?module=plant_market`

### Submission API
- `GET /api/identity/applications`: authenticated user's own application history.
- `POST /api/identity/applications`: authenticated applicant only; server derives `user.id`.
- Modules accepted for new seller submissions: `marketplace`, `plant_market`.
- Evidence path contract: `evidence_paths` remains an array of 1–5 UUID-named objects under the authenticated user's `identity-verification/{userId}/` folder.
- Existing JSONB payload stays under the current database constraint (32 KB).
- Existing pending-application uniqueness and review RPC remain authoritative.

### Domain mapping
- Marketplace: `organizations` record, current organization type enum, verified organization and organization-scoped grant.
- Plant Market: `gardener_profiles`, current `gardening_types text[]`, verified profile and global grant.
- Additional seller category and form declarations remain in `applicant_data`; do not overload `organizations.organization_type` or `gardener_profiles.gardening_types` with new incompatible values.

## 3. Seller category catalogue

### Marketplace

| Category key | Bengali label | Existing organization type mapping | Additional requirements |
|---|---|---|---|
| `retailer` | খুচরা বিক্রেতা / দোকান | `shop` | Shop/business address |
| `wholesaler` | পাইকারি বিক্রেতা | `company` | Supply capacity and coverage |
| `authorized_dealer` | অনুমোদিত ডিলার / ডিস্ট্রিবিউটর | `dealer` | Authorization proof only when claiming authorized status |
| `manufacturer` | উৎপাদক / ব্র্যান্ড | `company` | Production/source description |
| `cooperative` | সমবায় / কৃষক সংগঠন | `cooperative` | Organization contact and service area |
| `agri_service_provider` | কৃষি সেবা প্রদানকারী | `other` | Service description |
| `other_business` | অন্যান্য ব্যবসা | `other` | Explain business activity |

All applicants provide business name, responsible contact name, contact phone, district, full business address, seller category, product/source declaration and policy consent. Website, trade-license/registration number, warehouse/shop photos and additional evidence are optional or conditional unless the activity/product law requires them. Do not reject an individual or small operator merely for not having a trade license unless legally required for that activity.

### Plant Market

| Category key | Bengali label | Additional requirements |
|---|---|---|
| `nursery_owner` | নার্সারি মালিক / পরিচালনাকারী | Nursery name, location/address, operation declaration, nursery photos recommended |
| `plant_grower` | গাছ উৎপাদক / চাষি | Growing location, own-grown/source declaration |
| `fruit_sapling_grower` | ফলের চারা / কলম উৎপাদক | Growing location, propagation/source declaration |
| `ornamental_plant_seller` | ফুল ও শোভাবর্ধক গাছ বিক্রেতা | Stock/source declaration |
| `seed_cutting_seller` | বীজ / কাটিং / চারা বিক্রেতা | Source and product-type declaration |
| `plant_reseller` | গাছের রিসেলার | Supplier/source declaration |
| `gardening_supplies` | বাগান ও গ্রোয়িং সামগ্রী | Business/shop details when applicable |
| `hobby_gardener` | ব্যক্তিগত / শখের বাগানপ্রেমী | District, gardening types and experience |

All Plant Market applicants provide district, seller category, gardening/product types, experience/operation note, source declaration and policy consent. Nursery name/location are required for `nursery_owner`; they are not required for a hobby gardener. Registration evidence is conditional on applicable law and business type.

## 4. Payload contract (version 1)

The API stores the following additive keys in existing `applicant_data`. Existing keys remain unchanged for legacy records.

### Common
- `schema_version: 1`
- `seller_category: string`
- `contact_name: string`
- `contact_phone: string`
- `district: string`
- `delivery_coverage: string`
- `source_declaration: string`
- `policy_accepted: true`
- `evidence_paths: string[]` (existing security contract; do not rename)
- `evidence_types: string[]` (parallel metadata for newly submitted evidence, optional for legacy records)

### Marketplace
- Preserve `organization_name`, `organization_type`, `trade_license`, `business_address`, `website`.
- Add `business_description` and `seller_category`.
- Map the category to the existing organization type enum exactly as specified above.
- Do not add arbitrary category keys to the organizations table.

### Plant Market
- Preserve `district`, `gardening_types`, `experience_note`, `evidence_paths`.
- Add `seller_category`, `nursery_name`, `nursery_address`, `operating_model`, `source_declaration`, `delivery_coverage`.
- Keep `gardening_types` values within the existing free-text-compatible array contract; new seller category is stored separately.

Payload must remain an object and below 32 KB. Reject unknown seller category values. Strip unknown client keys rather than trusting them.

## 5. Validation rules

- Require authenticated session using `supabase.auth.getUser()`; never accept a client user ID.
- Allow only `marketplace` and `plant_market` in this API.
- Trim text; enforce explicit maximum lengths and reject whitespace-only required values.
- Validate phone syntax without assuming OTP ownership; OTP verification is a separate account-auth state.
- Validate website as HTTPS URL if present.
- Validate district, seller category and existing organization type against allowlists.
- Validate conditional nursery fields for nursery owner.
- Validate source declaration and policy consent.
- Preserve 1–5 private evidence files, current extension/size restrictions and caller-owned UUID paths.
- Ensure storage object existence and ownership before insert.
- Do not trust client-supplied `organization_id`, `status`, `reviewed_by`, grant, verification status or role.
- Continue to reject duplicate open or already-approved module applications.
- Keep current database uniqueness/RLS constraints as defense in depth.

## 6. UX wizard

1. Choose market (Marketplace / Plant Market).
2. Choose seller category.
3. Contact and location.
4. Business / nursery / growing details (category-dependent).
5. Product source and delivery coverage.
6. Supporting evidence upload.
7. Review declaration and submit.

UI requirements:
- Show progress, required/conditional labels and contextual examples.
- Hide irrelevant fields; preserve values only while switching category in the current form session and clear incompatible values before submit.
- Explain why documents are requested and who can review them.
- Display accepted file types, maximum size/count and private-storage explanation.
- Keep the current status history and review note.
- Prevent double-submit and retain actionable API errors.
- Accessible labels, focus states, keyboard navigation and mobile layout.
- Bengali-first copy with clear English technical terms where useful.

## 7. Admin contract

- Keep existing `ApplicationManagement` shared component and `identity.review` permission.
- Preserve current Marketplace seller queue and identity queue behavior.
- The shared Identity queue can filter Plant Market and Marketplace; a dedicated Plant Market queue navigation item is a follow-up after confirming Admin route/menu RBAC.
- Render `seller_category`, contact, location, source declaration and typed evidence metadata safely from JSONB.
- Never expose raw NID or add identity data not collected.
- Signed evidence URLs remain short-lived and applicant-path-scoped.
- Decisions remain only Approve / Reject through `admin_review_module_application`; rejection requires a reason.

## 8. Acceptance criteria

- Existing URLs and module query values continue working.
- Existing applications still render without schema-version keys.
- Every seller category renders correct conditional fields.
- API rejects missing conditional fields and unknown categories even when bypassing UI.
- API rejects wrong module, malformed phone/URL, missing consent, invalid payload, unowned/missing evidence and duplicate active application.
- Marketplace category maps only to existing organization type enum.
- Plant Market category does not alter the existing gardening_types semantics.
- Approving Marketplace grants only the correct organization-scoped access.
- Approving Plant Market grants only global Plant Market access.
- Rejection does not grant access and retains review history.
- No NID/selfie/liveness claim is shown.
- No database migration or production mutation occurs in Phase 1 initial slice.

## 9. Implementation sequence

1. Add this spec and contract tests.
2. Add shared typed category definitions and server validators.
3. Upgrade applicant UI to category-driven wizard.
4. Upgrade API to validate and persist versioned additive payload keys.
5. Add Admin read-only category/declaration display if safe and compatible.
6. Run identity workflow, module access, Admin application and seller submission regression scripts.
7. Run lint, TypeScript, production build and CI.
8. Keep the PR draft until review, exact-SHA Preview and isolated authenticated workflow QA pass.
