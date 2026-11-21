# AGRIVA agriculture reference data

## Bangladesh administrative locations

- File: `bangladesh-upazilas.json`
- Records: 495 upazilas under 64 districts and 8 divisions.
- Fields: BBS-style administrative identifier, Bangla/English upazila name, district and division parent names.
- Upstream source: `open-admin-data/bangladesh-administrative-divisions`, `data/all-upazila.json`.
- Upstream source notes cite Bangladesh Bureau of Statistics geocodes published as Bangladesh Subnational Administrative Boundaries (COD-AB) by UN OCHA; see upstream README for source and licence.
- This is an administrative lookup dataset, not an agricultural suitability dataset.

## Agricultural evidence sources (not yet imported as machine-readable records)

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
