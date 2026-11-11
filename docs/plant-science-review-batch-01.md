# Plant-science nomenclature review — Batch 01

## Scope

This batch contains the 18 catalogue rows whose scientific-name strings do not fit a deliberately conservative simple-binomial / infraspecific-name pattern. The pattern is a triage heuristic only: author citations, hybrid formulas, cultivar groups, and botanical ranks may all be valid. None of the rows is automatically corrected by this report.

## Evidence checked in this pass

| Catalogue row | Supplied string | Reference finding | Safe action |
|---:|---|---|---|
| 452 | `Zea mays convar. saccharata` | Kew POWO lists `Zea mays subsp. saccharata` as a synonym of accepted `Zea mays subsp. mays`. | Preserve the verbatim source string; record a candidate synonym mapping only after matching the intended taxon. |
| 528 | `Capsicum annuum Group Grossum` | Kew POWO treats `Capsicum annuum var. grossum` as a synonym of `Capsicum annuum var. annuum`; this does not by itself prove the supplied cultivar-group string is the same nomenclatural name. | Keep as cultivar/group-level review; do not silently rewrite as a species synonym. |
| 626 | `Sorghum bicolor (sweet-stem group)` | POWO search evidence supports `Sorghum bicolor subsp. bicolor` as a taxon placement, but does not establish the exact horticultural group wording in this row. | Preserve as a crop-group label pending a crop-taxonomy source. |
| 775–776 | `Beta vulgaris subsp. vulgaris Altissima Group`; `... Crassa Group` | Kew accepts `Beta vulgaris subsp. vulgaris` in Amaranthaceae and lists `Beta altissima` among synonyms. Horticultural references map sugar beet / fodder beet cultivar groups under this subspecies. | Keep cultivar-group identity separate from taxon rank; candidate parent taxon is `Beta vulgaris subsp. vulgaris`. |
| 971 | `Citrus nobilis × Citrus deliciosa` | Kew POWO treats `Citrus × deliciosa` and `Citrus × nobilis` names in the relevant synonymy as synonyms of `Citrus × aurantium f. deliciosa`. The supplied formula may encode a hybrid parentage claim, not a simple synonym. | Do not replace the hybrid formula without checking the source's intended Kinnow/cultivar interpretation. |
| 1218 | `Capsicum chinense Jacq.` | Kew POWO accepts this name in Solanaceae. | Remove author citation only in a separate display-normalization layer; preserve verbatim scientific name and source. Bangladesh occurrence still requires separate evidence. |
| 464, 1220–1239 (remaining Solanum/Capsicum entries) | Hybrid marker or author citations | Not fully resolved against individual POWO records in this pass. | Leave pending; no accepted-name or Bangladesh-occurrence claim is made. |

## Primary reference links

- Kew POWO, *Zea mays subsp. saccharata*: https://powo.science.kew.org/taxon/77255970-1
- Kew POWO, *Capsicum annuum var. grossum*: https://powo.science.kew.org/taxon/44854-2
- Kew POWO, *Beta vulgaris subsp. vulgaris*: https://powo.science.kew.org/taxon/165550-3
- Kew POWO, *Citrus × deliciosa*: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:771886-1
- Kew POWO, *Citrus × nobilis* subf. *deliciosa*: https://powo.science.kew.org/taxon/890794-1
- Kew POWO, *Capsicum chinense*: https://powo.science.kew.org/taxon/814752-1

## Guardrails

- A Kew accepted name is a global taxonomic decision, not evidence of occurrence in Bangladesh.
- A cultivar group, crop-use label, or hybrid formula must not be coerced into a species-level taxon.
- Preserve the supplied name and source note. Store a proposed accepted-name relationship as a separate, reviewable assertion with backbone version, source URL, access date, and reviewer.
- The 18-row queue remains pending until each entry has an individual taxonomic decision and Bangladesh occurrence evidence where that claim is needed.
