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

## Additional agricultural evidence sources (not yet imported as machine-readable records)

1. BAMIS / Department of Agricultural Extension, *Districtwise Distribution of Major Crops in Bangladesh* (PDF, 2020):
   https://www.bamis.gov.bd/res/attachment/2020/02/16/13310.pdf
   - The document provides a district-by-crop-category presence matrix and states rice is cultivated in all districts.
   - The full matrix must be transcribed and double-checked against the PDF before it is represented as AGRIVA's district crop profile.
2. BARC Agri-Advisory Portal, Crop Suitability:
   https://portal.cropzoning.gov.bd/cropSuitability
   - Provides district and upazila selection and crop suitability classes.
3. BARC Crop Zoning project:
   https://portal.cropzoning.gov.bd/aboutProject
   - The project page reports suitability assessment for 76 crops across 464 of 495 upazilas.
4. BARC Crop Zoning Information System:
   https://czis.cropzoning.gov.bd/
   - Provides GIS-based crop suitability, land/soil and crop zoning tools.

## Important implementation rule

Do not infer the 31 unassessed upazilas, do not treat district crop presence as upazila suitability, and do not fabricate crop-specific suitability percentages. AGRIVA may show a suitability class only after the corresponding BARC record has been obtained and verified. Keep the data source, source date/version and geographic level attached to every imported record.
