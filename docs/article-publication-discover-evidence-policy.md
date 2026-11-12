# AGRIVA Article Publication & Discover Readiness

## Verified publication timestamp
- `published_at` is assigned by the database when an approved draft transitions to published, not copied from `created_at`.
- Unpublishing clears it; republishing records a new publication time. Historical articles have unknown original publication times and **must not be backfilled from creation dates**.
- `datePublished` and `dateModified` in JSON-LD are emitted only from real publication metadata. Editorial changes require the approved workflow.

## Verified author and reviewer
- Admin editors supply actual byline and reviewer names; `author_verified_by` and `reviewed_by` must correspond to admin profiles.
- Never invent credentials, biographies, institutional affiliations, or reviewer names.
- Verify identities outside the automation before entering names. The database can confirm admin authorization, **not real-world identity**.

## Image policy
- Each newly published article must have an editor-approved HTTPS hero image, minimum recorded dimensions 1200×630, descriptive alt text and rights to use it.
- Metadata dimensions alone do not prove the uploaded image resolution, license, or subject match. The editorial team must inspect the actual file and licensing.
- The article page exposes an Open Graph image and `max-image-preview:large` when metadata is available. Images are not fabricated or reused indiscriminately.
- No automatic Discover placement is promised. Follow current Google Search Central Discover guidance.

## Claim-by-claim evidence
- Each factual claim needs a source URL and verification note in `claim_evidence`.
- Reviewers must check the actual source passage, date, crop variety, Bangladesh applicability, units, dosage, season and conflicting advice.
- Government extension, agricultural research institutions and peer-reviewed research are preferred where applicable.
- `verified:true` is an editorial attestation, not automated fact checking. Publishing without evidence is blocked by the new database guard.
- Chemical dosages and treatment claims require qualified agricultural review.

## Rollout safety
- Migration is **draft only**. Do not apply to production until CI PostgreSQL execution and a reviewed rollout plan pass.
- The new view extends the existing security-invoker published-only projection; no internal verification notes are public.
- Existing published rows remain accessible, but may lack historic provenance. Audit them manually rather than invent metadata.
- Before deployment, implement the admin editing workflow for byline, hero image, per-claim sources and publication approval. Otherwise the new gate will intentionally block new publishing.
