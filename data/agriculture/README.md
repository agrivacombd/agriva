# AGRIVA agriculture reference data

## Bangladesh administrative locations

- File: `bangladesh-upazilas.json`
- Records: 495 upazilas under 64 districts and 8 divisions.
- Fields: BBS-style administrative identifier, Bangla/English upazila name, district and division parent names.
- Upstream source: `open-admin-data/bangladesh-administrative-divisions`, `data/all-upazila.json`.
- Upstream repository reports 8 divisions, 64 districts and 495 upazilas; dataset licence: CC-BY-4.0; last upstream update stated as 2026-09-08. This is a third-party administrative reference dataset, not an official agricultural dataset.
- This is an administrative lookup dataset, not an agricultural suitability dataset.

## District crop statistics

- File: `district-crop-area-shares-2022-23.json`
- Coverage: 64 unique districts.
- Metric: share of gross cropped area (%) for rice, wheat, maize, potato, pulses, oilseeds, vegetables, chili, onion, sugarcane and jute; gross cropped area in hectares.
- Reference period: 2022/23.
- Source: IFPRI, *Food Security and Nutrition in Bangladesh: Evidence-Based Strategies for Advancement* (October 2024), Table 3.7, pp. 212–213. The table states its underlying source as BBS, *Yearbook of Agricultural Statistics 2023*.
- This is observed district-level crop-area share, not crop suitability and not upazila-level data. Shares can sum to more than 100% because multiple crops may be grown on the same land across seasons.

## BARC Crop Suitability API investigation (not production-approved)

- Official portal page: https://portal.cropzoning.gov.bd/cropSuitability
- Project/methodology page: https://portal.cropzoning.gov.bd/aboutProject
- API base observed in the portal's client code: `https://api1.cropzoning.gov.bd`
- Endpoints:
  - `/api/crop-suitability-districts`
  - `/api/crop-suitability-upazilas/{district_code}`
  - `/api/crop-suitability/{upazila_code}`
- Reproducible collector: `scripts/agriculture/collect-barc-crop-suitability.mjs`. It writes `barc-crop-suitability-api-raw.json` and `barc-crop-suitability-api-summary.json` under this directory. It uses a conservative request delay, retries rate limits/server errors, and rejects missing/blank class-area values. Node syntax check passed. A fresh 2026-11-22 run in a new Vercel sandbox was blocked before data retrieval because Node and curl could not verify the API TLS certificate chain (`UNABLE_TO_VERIFY_LEAF_SIGNATURE` / issuer unavailable). TLS verification was not disabled; rerun from a trusted environment or after the certificate-chain issue is resolved.
- Investigation capture (2026-11-21): 64 districts, 483 upazila directory entries, 483 upazilas with records, 50,724 suitability rows, 95 distinct crop names, 140 crop IDs and three season labels (Rabi, Kharif-1, Kharif-2). No API errors, duplicate composite keys or invalid/non-negative numeric area values were observed in this capture.
- Summary and SHA-256 manifest: `barc-crop-suitability-api-manifest.json`.
- The 2026-11-21 raw capture was not committed to Git; its temporary sandbox has stopped. A new 2026-11-22 capture attempt was blocked by TLS certificate-chain verification in the Vercel sandbox. The historical audit summary remains committed, but record-level raw data must be recollected from a trusted environment; do not treat the historical hash as a currently downloadable archive.
- Reviewed BARC-to-AGRIVA join map: `barc-crop-suitability-crosswalk.json`. BARC's `upazila_code` is a different code system from AGRIVA's `BD...` IDs; do not join by concatenating or assuming the codes are interchangeable.
- Crosswalk result: 481 of 483 BARC directory entries map one-to-one to AGRIVA upazilas. The two unmatched BARC entries are Gazipur City Corporation and Rangpur City Corporation, which are not one-to-one upazila entries in AGRIVA. Fourteen AGRIVA administrative IDs have no BARC crosswalk row in this API directory. Separately, the two unmatched BARC entries are Gazipur City Corporation and Rangpur City Corporation; they are not AGRIVA upazila records.
- Crop inventory audit: `barc-crop-suitability-crop-inventory-audit.json`, reproducible with `scripts/agriculture/audit-barc-crop-suitability.mjs`.
- The API has 95 distinct crop labels and 140 crop IDs (IDs are not one-to-one with names). A coverage analysis found 76 labels sharing the exact same 482-code coverage set. This is a strong match to the published 76-crop count, but **does not prove that these are BARC's official final 76 crop names**. BARC confirmation is still required.
- That 482-code cluster maps to 480 AGRIVA upazila records plus two BARC city-corporation entries (Gazipur City Corporation and Rangpur City Corporation). The BARC directory contains one further entry outside this cluster: Banchharampur, Brahmanbaria (code 201204). The other 19 crop labels have different coverage patterns; three (Black Gram, Boro dhan and Tea) have 483 entries, while 16 have partial coverage.
- **Updated official coverage reference:** BARC's *Annual Report 2025–2026*, published October 2026, reports that suitability assessment for 76 crops was completed in 30 additional upazilas, bringing cumulative coverage to 479 of 495 upazilas (pp. 6 and 9): https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2026/9/cae1a14a-896a-4f97-b1c8-76a13fab40a6.pdf
- The current project page separately states 76 crops across 464 upazilas: https://portal.cropzoning.gov.bd/aboutProject. The API's 480 mapped upazilas in the main coverage cluster is one higher than the October 2026 annual-report figure; the API also has two city-corporation entries. These figures may reflect different reporting dates, assessment vintages or boundary treatments. They must be reconciled with BARC before the API capture is described as the final 76-crop assessment.
- **Area-unit cross-check:** The BARC dashboard labels suitability class totals as hectares. For Boro dhan, crop ID 1 (Favourable Environment, Rabi), the API totals for `vs/s/ms/ls/ns` are 4,135,919 / 2,232,017 / 1,209,085 / 213,096 / 2,328,551 (total 10,118,668). The current dashboard shows 4,118,560 / 2,224,969 / 1,227,522 / 203,541 / 2,316,663 ha (total 10,091,255 ha). The total differs by 27,413 (0.272%). This is strong evidence that the API values are hectare areas, but the non-exact match and missing API unit metadata mean BARC must still confirm the unit and snapshot alignment before AGRIVA labels them as ha. Dashboard: https://dashboard.cropzoning.gov.bd/
- These records are official-portal responses but are **investigation-only**, not verified final suitability recommendations. Do not expose them as current crop recommendations, yield forecasts or profitability rankings. No suitability data from this capture has been added to the public AGRIVA UI.

## Additional agricultural evidence sources (not yet imported as machine-readable records)

1. BAMIS / Department of Agricultural Extension, *Districtwise Distribution of Major Crops in Bangladesh* (PDF, 2020):
   https://www.bamis.gov.bd/res/attachment/2020/02/16/13310.pdf
   - The document provides a district-by-crop-category presence matrix and states rice is cultivated in all districts.
   - The full matrix must be transcribed and double-checked against the PDF before it is represented as AGRIVA's district crop profile.
2. BARC Crop Zoning Information System:
   https://czis.cropzoning.gov.bd/
   - Provides GIS-based crop suitability, land/soil and crop zoning tools.

## Important implementation rule

Do not infer unassessed upazilas, do not treat district crop presence as upazila suitability, and do not fabricate crop-specific suitability percentages. AGRIVA may show a suitability class only after the corresponding BARC record, its assessment scope, reference period, units and geographic crosswalk have been obtained and verified. Keep the data source, source date/version and geographic level attached to every imported record.
