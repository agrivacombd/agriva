# Seller Requirements Matrix

**Status:** Proposed requirements for product and legal review. This is not a declaration that every document is legally mandatory.

## 1. Shared applicant requirements

| Field / evidence | Individual grower | Business / shop / dealer | Nursery / producer | Reseller |
|---|---|---|---|---|
| Authenticated AGRIVA account | Required | Required | Required | Required |
| Verified mobile OTP | Required | Required | Required | Required |
| Applicant full name | Required | Required | Required | Required |
| Contact phone | Required | Required | Required | Required |
| District / upazila / address | Required | Required | Required | Required |
| Seller category | Required | Required | Required | Required |
| Identity evidence | Required, secure method | Required, secure method | Required, secure method | Required, secure method |
| Selfie / liveness | Risk-based / provider-dependent | Risk-based / provider-dependent | Risk-based / provider-dependent | Risk-based / provider-dependent |
| Consent and declaration | Required | Required | Required | Required |
| Payout ownership verification | Before payout | Before payout | Before payout | Before payout |

**Identity evidence note:** Current implementation accepts generic private JPG/PNG/PDF evidence; it does not implement a structured NID-front/NID-back + selfie/face-match workflow. NID capture, authenticity checks, liveness and external verification must be introduced only after legal basis, provider, consent, security, retention and manual-review fallback are approved. Prefer a verification result/reference and masked metadata over retaining raw NID values where possible.

## 2. Marketplace requirements

| Requirement | Company | Shop | Dealer / distributor | Cooperative | Individual producer |
|---|---|---|---|---|---|
| Organization name/type | Required | Required | Required | Required | Conditional |
| Business address | Required | Required | Required | Required | Required |
| Trade license / registration | Where applicable | Where applicable | Where applicable | Where applicable | Conditional |
| Authorized dealer proof | N/A | Conditional | Required for claimed authorized status | Conditional | N/A |
| Supplier / manufacturer source | Required by product category | Required by product category | Required | Required | Required by product category |
| Purchase invoice / source proof | Risk/category-based | Risk/category-based | Risk/category-based | Risk/category-based | Risk/category-based |
| Product-specific license/registration | Where applicable | Where applicable | Where applicable | Where applicable | Where applicable |
| Shop / warehouse photos | Recommended / risk-based | Recommended / risk-based | Recommended | Recommended | Optional |
| Delivery coverage & capacity | Required | Required | Required | Required | Required |
| Return / replacement declaration | Required | Required | Required | Required | Required |

Marketplace approval remains tied to a verified `organizations` record and organization-scoped grants. Do not issue a global Marketplace create grant.

## 3. Plant Market requirements

Seller categories to support:
- Nursery owner/operator.
- Plant grower / producer.
- Fruit sapling or grafted-plant seller.
- Flower / ornamental / indoor plant seller.
- Seeds, cuttings and seedlings seller.
- Gardening supplies seller.
- Plant reseller.
- Individual / hobby gardener.

| Requirement | Individual gardener | Nursery / grower | Plant reseller | Gardening supplies |
|---|---|---|---|---|
| Seller category | Required | Required | Required | Required |
| Garden / nursery name | Optional | Required | Optional | Business name |
| Nursery location / map pin | Optional | Required | Optional | Business address |
| Garden / nursery photos | 1–3 recommended | 3+ recommended | Stock/source photos | Shop / stock photos |
| Ownership / operation declaration | Required | Required | N/A | Required |
| Own-grown vs sourced | Required | Required | Required | Required |
| Plant species / variety | Product-level | Product-level | Product-level | Product-level where relevant |
| Plant age / size / grafted status | Product-level where relevant | Product-level where relevant | Product-level where relevant | N/A |
| Health / pest disclosure | Product-level | Product-level | Product-level | Product-level where relevant |
| Stock / availability | Required before listing | Required before listing | Required before listing | Required before listing |
| Live-plant packaging method | If shipping live plants | Required | Required if applicable | N/A |
| Delivery area and timing | Required | Required | Required | Required |
| DOA / damage / replacement policy | Required for live plants | Required | Required | Relevant return policy |

A small home grower should not be blocked for lacking a commercial nursery registration if the law does not require it for their activity. Registration and plant-specific permissions should be conditional on business type and regulated category.

## 4. Document taxonomy

Use typed document metadata, not an unlabelled upload pile.

| Document type | Market | Requirement |
|---|---|---|
| Identity proof | Both | Required |
| Address proof | Both | Risk-based / fallback |
| Trade license | Marketplace | Conditional |
| Business registration / BIN / TIN | Marketplace | Where applicable |
| Dealer authorization | Marketplace | Only when claiming authorized dealer |
| Supplier invoice | Both | Category / risk-based |
| Product license / registration | Both | Where applicable |
| Nursery registration | Plant Market | Conditional |
| Nursery ownership / lease / operation proof | Plant Market | Risk-based |
| Nursery / stock photos | Plant Market | Category-dependent |
| Payout ownership proof | Both | Before first payout |

For every upload record: document type, owner, application ID, storage object path, original filename (sanitized), MIME type, byte size, upload timestamp, review status, reviewer, review timestamp, expiry/retention date and rejection reason. Never store signed URLs as permanent evidence references.

## 5. Form validation

- Trim and length-limit all text fields server-side.
- Use allowlisted enum values for seller type, organization type and document type.
- Validate MIME type and file signature, not only extension.
- Enforce file size, count and per-application limits.
- Reject unowned storage paths and paths outside the applicant's folder.
- Validate HTTPS website URLs and normalize phone numbers to Bangladesh format where appropriate.
- Do not accept arbitrary JSON keys as trusted verification facts.
- Distinguish required, conditional and optional evidence in both UI and API.
- Keep rejected applications resubmittable under explicit policy; prevent concurrent duplicate active applications.

## 6. UX copy and fairness

Explain why each sensitive field is needed, who can view it, how long it is retained, and how to request correction/deletion where legally allowed. Offer manual review if automated verification is unavailable or inconclusive. Do not imply that uploading an NID alone proves business authorization or product authenticity.
