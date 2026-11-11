# Plant-science review batch 01 — evidence update (2026-11-11)

This is a source-evidence supplement, not a blanket acceptance of the catalogue's Bangladesh occurrence claims.

## Findings supported by the opened Kew POWO records

| Catalogue row | Verbatim catalogue name | Kew evidence | Decision in AGRIVA |
|---:|---|---|---|
| 452 | `Zea mays convar. saccharata` | POWO record for `Zea mays subsp. saccharata` explicitly says it is a synonym of `Zea mays subsp. mays`. | Candidate mapping only. Keep the source string; do not silently substitute a different rank/name until the record's intended crop concept is confirmed. |
| 1218 | `Capsicum chinense Jacq.` | POWO explicitly marks `Capsicum chinense` accepted, family Solanaceae. Its distribution lists native range in northern South America, not Bangladesh. | Taxonomic name accepted; Bangladesh occurrence is not established by this POWO page. |
| 971 | `Citrus nobilis × Citrus deliciosa` | POWO marks `Citrus × aurantium f. deliciosa` accepted; its hybrid formula is `C. maxima × C. reticulata`; it lists Bangladesh as introduced. POWO also treats `Citrus × deliciosa` as a synonym of that accepted hybrid. | The catalogue formula is not the POWO hybrid formula. Keep pending; do not map the supplied parentage formula to the accepted hybrid without checking the original record's meaning. |
| 464 | `× Triticosecale` | The current search pass did not locate an individual POWO taxon page sufficient to settle this hybrid genus name. | Pending; no automatic correction. |
| 528 | `Capsicum annuum Group Grossum` | This pass did not verify the exact cultivar-group string against a primary cultivar/nomenclatural authority. | Pending at cultivar-group level. |
| 626 | `Sorghum bicolor (sweet-stem group)` | POWO records `Sorghum saccharatum` as a synonym of `Sorghum bicolor subsp. bicolor`; this does not resolve the sweet-stem crop-group wording. | Candidate parent taxon only; crop group remains pending. |
| 775–776 | `Beta vulgaris subsp. vulgaris Altissima/Crassa Group` | Previous POWO lookup supports `Beta vulgaris subsp. vulgaris` as the accepted parent taxon; the horticultural group names were not independently verified in this pass. | Parent taxon candidate only; cultivar-group status pending. |

## Solanum/Capsicum author-citation rows

The POWO genus-level page for *Solanum* lists the following catalogue names among its accepted species list: *S. acaule*, *S. arcanum*, *S. betaceum*, *S. cheesmaniae*, *S. chilense*, *S. corneliomulleri*, *S. habrochaites*, *S. peruvianum*, and *S. pimpinellifolium*. This is evidence that these binomials are treated as accepted species in the displayed genus checklist; it is not a substitute for capturing each individual taxon record, its taxonomic authority, or its distribution page.

*Capsicum chinense* is individually accepted by POWO as noted above. The exact individual page for *Capsicum pubescens* was not captured in this pass.

## Bangladesh occurrence rules

- POWO's accepted-name status is not evidence of Bangladesh occurrence.
- POWO explicitly lists Bangladesh as introduced for *Citrus × aurantium f. deliciosa*; this is a global distribution assertion from Kew and should be preserved with its "introduced" qualifier.
- POWO's *Capsicum* genus page lists Bangladesh as introduced at genus level only. Do not infer that every *Capsicum* species in the catalogue occurs in Bangladesh from that genus-level entry.
- CVPB's About page says the checklist contains 4,754 species, 1,709 genera and 234 families, and describes its compilation as including floristic literature and specimen-number checks. A specific taxon inclusion still needs its individual CVPB record.
- A new GBIF dataset registered 6 October 2026 documents Bangladesh crop-wild-relative occurrence records, with localities and herbarium records where available. Use individual occurrence rows/specimen citations, not the dataset title alone, to substantiate a particular species.

## Sources opened

- Kew POWO, *Zea mays subsp. saccharata*: https://powo.science.kew.org/taxon/77255970-1
- Kew POWO, *Capsicum chinense*: https://powo.science.kew.org/taxon/814752-1
- Kew POWO, *Citrus × aurantium f. deliciosa*: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:890757-1
- Kew POWO, *Citrus × deliciosa*: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:771886-1
- Kew POWO, *Sorghum saccharatum*: https://powo.science.kew.org/taxon/422198-1
- Kew POWO, *Solanum* genus checklist: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:30000630-2
- CVPB About: https://eflorabd.natureinfo.com.bd/about/
- GBIF Bangladesh crop wild relatives dataset: https://www.gbif.org/dataset/c0eddfec-c87b-47c5-977a-dd2c7c7e5dec

## Status

No catalogue row has been marked as fully reviewed for both taxonomy and Bangladesh occurrence. The 18-row JSON queue remains a pending manual-review worklist.