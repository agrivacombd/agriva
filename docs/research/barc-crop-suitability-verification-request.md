# BARC Crop Suitability Data Verification Request

**Purpose:** Obtain written confirmation before AGRIVA imports or publishes any BARC crop-suitability records.

**Prepared:** 22 November 2026  
**Prepared by:** AGRIVA.com.bd research team  
**Status:** Draft for review; not sent

## Official references checked

1. BARC Annual Report 2025–2026, published October 2026, foreword and executive summary (printed pp. 6 and 9): reports completion of suitability assessments for 76 crops in 30 additional upazilas, bringing cumulative coverage to 479 of 495.
   - https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2026/9/cae1a14a-896a-4f97-b1c8-76a13fab40a6.pdf
2. BARC information for Bangladesh Economic Review 2026, printed p. 3: says crop-zoning activities for 76 crops have been completed in 480 upazilas and work in the remaining 15 is ongoing.
   - https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2026/8/1dd01cf9-4ada-4159-9a2f-376f8beedbef.pdf
3. Current Agri-Advisory project page: states 76 crops across 464 upazilas.
   - https://portal.cropzoning.gov.bd/aboutProject
4. Agri-Advisory Crop Suitability interface:
   - https://portal.cropzoning.gov.bd/cropSuitability
5. Crop Zoning Dashboard:
   - https://dashboard.cropzoning.gov.bd/

## Findings that need BARC confirmation

A historical API capture (21 November 2026) contained 50,724 suitability records, 95 distinct crop labels and 140 crop IDs across 483 directory entries. A coverage-pattern audit found 76 crop labels sharing an identical set of 482 BARC location codes. The set maps to 480 AGRIVA upazila records plus two city-corporation entries (Gazipur and Rangpur). One additional API directory entry, Banchharampur, Brahmanbaria, was outside that common coverage set.

For Boro dhan, crop ID 1, Favourable Environment, Rabi, the API totals across fields vs/s/ms/ls/ns were 10,118,668. The public dashboard labels area in hectares and displays 10,091,255 ha for the same named crop/situation view, a difference of 27,413 (0.272%). This suggests hectares but does not establish the API unit or prove the two views are the same snapshot.

The historical raw capture is not currently available in the repository; the summary and audit are retained. A fresh capture attempt on 22 November 2026 was blocked by TLS certificate-chain verification in the investigation sandbox. No TLS verification bypass was used.

## Questions for BARC

1. **Authoritative crop list:** Please provide the current official list of the 76 assessed crops, including canonical English and Bangla names, crop IDs, crop groups, seasons, crop situations/environments, and any aliases or renamed crops. Are the 95 labels and 140 IDs returned by the public API expected, and which 76 labels constitute the completed assessment?
2. **Assessment coverage and vintage:** What is the authoritative current count and reference date for completed crop-suitability assessments: 464, 479, or 480 upazilas? Do the 479 figure in the FY 2025–26 Annual Report and the 480 figure in the Bangladesh Economic Review 2026 refer to different cut-off dates, different definitions (assessment completed versus crop-zoning activities completed), or boundary treatment?
3. **Geographic entities:** Does the API intentionally include Gazipur City Corporation and Rangpur City Corporation as separate assessment units? Is Banchharampur, Brahmanbaria expected to be absent from the 76-crop common coverage group? Please share the authoritative BARC upazila/city-corporation code list and any boundary/version date.
4. **Area units and class definitions:** Are API fields `vs`, `s`, `ms`, `ls`, and `ns` area totals in hectares? Please provide the data dictionary, precision/rounding rules, no-data convention, and the exact class order. The portal also describes yield bands (80–100%, 60–80%, 40–60%, 20–40%, 0–20%); please clarify whether these percentages describe relative attainable yield classes while the API fields represent land area.
5. **API data version:** Please provide the API dataset's assessment/reference year, last-updated timestamp, version or release identifier, and whether the API and public dashboard are generated from the same database snapshot.
6. **Interpretation and reuse:** May AGRIVA reproduce the crop-suitability class areas with attribution and a source date? Are there licensing, attribution, refresh-frequency, or disclaimer requirements? Please confirm that these classes are not yield forecasts or profitability rankings.
7. **Access for reproducibility:** Is there an approved downloadable CSV/Excel/API export, data dictionary, or technical contact for obtaining the full official records with TLS-valid API access?

## Suggested attribution if reuse is approved

"Source: Bangladesh Agricultural Research Council (BARC), Crop Zoning / Agri-Advisory Portal; dataset version and assessment date to be supplied by BARC. Geographic mapping to AGRIVA administrative IDs is maintained separately. Suitability classes describe BARC's assessment and are not a guarantee of yield or profit."

## Official contact routes published by BARC

- BARC Agri-Advisory/CZIS technical contact shown on the CZIS site: Hasan Md. Hamidur Rahman, Director (Computer & GIS), h.rahman@barc.gov.bd, +880-2-58152275.
  - https://czis.cropzoning.gov.bd/
- BARC portal contact: ec-barc@barc.gov.bd; info@barc.gov.bd; +880-2-9135587; +880-2-9110842.
  - https://portal.cropzoning.gov.bd/contact

**Important:** This is a prepared inquiry only. It has not been emailed or submitted, and no response from BARC has been received.
