# Plant-science review batch 04 — crop names and horticultural groups (2026-11-11)

This batch records a bounded second-pass review of the remaining crop/hybrid strings in review queue 01. It separates accepted-name evidence, crop-group interpretation, and Bangladesh occurrence. It does not silently rewrite source strings or promote any row to fully verified.

## Findings

| Source row | Verbatim catalogue string | Taxonomic / nomenclatural evidence | Bangladesh evidence | AGRIVA decision |
|---:|---|---|---|---|
| 452 | `Zea mays convar. saccharata` | POWO treats `Zea mays subsp. saccharata` as a synonym of `Zea mays subsp. mays`. The catalogue uses a different rank/form (`convar.`), so this is a candidate mapping, not an exact nomenclatural match. | No individual Bangladesh checklist or specimen record captured in this batch. | Keep the source string verbatim; map only after confirming the intended sweet-corn crop concept and Bangladesh source. |
| 464 | `× Triticosecale` | This search pass did not capture an authoritative individual taxon record sufficient to settle the hybrid genus / nothotaxon treatment. | No Bangladesh checklist or specimen record captured. | Pending. Do not invent a binomial or infer Bangladesh occurrence from global cultivation. |
| 528 | `Capsicum annuum Group Grossum` | Prior POWO comparison supports `Capsicum annuum var. grossum` as a synonym of `C. annuum var. annuum`; that does not itself authenticate the exact horticultural Group Grossum string. | No individual Bangladesh checklist or specimen record captured. | Parent species is plausible, but cultivar-group syntax and local occurrence remain pending. |
| 626 | `Sorghum bicolor (sweet-stem group)` | POWO accepts `Sorghum bicolor subsp. bicolor` and treats `Sorghum saccharatum` as its synonym. The parent taxon does not validate the parenthetical sweet-stem group as a formal taxonomic rank or cultivar group. | POWO lists the accepted subspecies as introduced in Bangladesh. This is global distribution evidence only; it does not establish a local sweet-stem cultivar or specimen. | Retain the crop concept as a provisional use-group label; do not treat the full string as a formal taxon. |
| 775 | `Beta vulgaris subsp. vulgaris Altissima Group` | POWO accepts `Beta vulgaris subsp. vulgaris`; `Beta vulgaris var. altissima` is a synonym of that subspecies. The University of Melbourne Multilingual Multiscript Plant Name Database recognizes `Beta vulgaris subsp. vulgaris (Altissima Group)` as sugar beet. | POWO lists the accepted subspecies as introduced in Bangladesh. No Bangladesh-specific sugar-beet cultivation/specimen evidence captured here. | Preserve the catalogue string; normalize display/group punctuation only after a deliberate schema decision. Taxonomic parent has support; local crop occurrence remains unverified. |
| 776 | `Beta vulgaris subsp. vulgaris Crassa Group` | The University of Melbourne plant-name database recognizes `Beta vulgaris subsp. vulgaris (Crassa Group)` and maps fodder-beet terminology to this group. POWO accepts the parent subspecies. | POWO lists the parent subspecies as introduced in Bangladesh; no local fodder-beet evidence captured. | Parent accepted and horticultural group supported by a specialist plant-name reference; Bangladesh crop occurrence remains unverified. |
| 971 | `Citrus nobilis × Citrus deliciosa` | POWO accepts `Citrus × aurantium f. deliciosa` with hybrid formula `C. maxima × C. reticulata`; the catalogue's stated parentage does not match that formula. | POWO lists the accepted Kew taxon as introduced in Bangladesh, but that distribution cannot validate the catalogue's mismatched hybrid formula. | Keep pending; do not map the catalogue formula to the Kew taxon without checking the original source's intended cultivar/hybrid. |

## Source references

- Kew POWO, `Zea mays subsp. saccharata`: https://powo.science.kew.org/taxon/77255970-1
- Kew POWO, `Sorghum saccharatum` (synonym of `Sorghum bicolor subsp. bicolor`): https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:422198-1
- Kew POWO, accepted `Sorghum bicolor subsp. bicolor`, including Bangladesh as introduced: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:3296834-4
- Kew POWO, accepted `Beta vulgaris subsp. vulgaris`, including Bangladesh as introduced: https://powo.science.kew.org/taxon/165550-3
- Kew POWO, `Beta vulgaris var. altissima` synonymy: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77421800-1
- University of Melbourne, Multilingual Multiscript Plant Name Database, Beta names and horticultural groups: https://www.plantnames.unimelb.edu.au/new/Sorting/Beta.html
- Kew POWO, accepted `Citrus × aurantium f. deliciosa`: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:890757-1
- Kew POWO, `Capsicum annuum` nomenclatural comparison is recorded in review batch 01 evidence update; the exact Group Grossum string remains unresolved.

## Interpretation and safeguards

- A parent taxon accepted by POWO does not automatically validate a cultivar/group descriptor attached to it.
- A POWO distribution marked “introduced into Bangladesh” is not evidence of native status, current cultivation, a specific cultivar, or a Bangladesh herbarium voucher.
- The University of Melbourne database is used here only for horticultural-group interpretation, not as proof of Bangladesh occurrence or as a substitute for POWO's accepted-name backbone.
- No row in review batch 01 is promoted to fully verified by this document. Original catalogue scientific-name strings remain unchanged; review status remains `needs_manual_review`.
