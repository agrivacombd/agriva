# Plant-science review batch 06 — Cyperaceae historical Bangladesh specimens

Review date: 2026-11-11

## Scope

This batch identifies candidate additions from a Bangladesh National Herbarium publication, checks them against the current AGRIVA catalogue, and performs a limited Kew POWO name check. It does **not** promote any row to fully verified: the source article reports historical CAL herbarium sheets from present-day Bangladesh territory, while exact accepted-name reconciliation and specimen-sheet inspection remain separate review tasks.

## Primary Bangladesh occurrence source

Islam, Tamanna Binte & Sarder Nasir Uddin. 2023. “Twelve New Additions to Cyperaceae of Bangladesh.” *Bulletin of Bangladesh National Herbarium* 9: 71–82.

- Article PDF: https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bnh/2024/12/7cadd14f0ece4eda8681127f5ed5bc59.pdf
- The authors examined 196 Cyperaceae herbarium sheets deposited at the Central National Herbarium, Kolkata (CAL), and report 12 species as new additions to the Bangladesh flora (PDF pp. 2–3; printed pp. 72–73).
- The paper states the sheets were collected from present-day Bangladesh territory and gives specimen citations, including historical “East Bengal” collections. This is published historical herbarium evidence, not a claim that the taxa were recently observed or that their populations persist today.
- The article itself should be cited at taxon level before adding occurrence claims to public catalogue rows. Where the paper records “specific locality unknown”, preserve that limitation.

## Catalogue cross-check

All 12 verbatim names below were absent from the current 1,905-record plants.ts catalogue at the time of this audit. Exact-name comparison only was used; no synonym expansion or fuzzy matching was applied.

| Verbatim name in BNH article | Family | Limited POWO check | Review disposition |
|---|---|---|---|
| *Carex baccans* Nees | Cyperaceae | POWO accepted; its distribution page explicitly includes Bangladesh as native. https://powo.science.kew.org/taxon/298747-1 | Strong candidate; keep pending until source sheet/name linkage is reviewed |
| *Carex insignis* Boott | Cyperaceae | POWO accepted; Bangladesh is not listed in the displayed native distribution. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:300322-1 | Published CAL occurrence evidence remains relevant; pending |
| *Carex myosurus* Nees | Cyperaceae | POWO accepted; distribution page explicitly includes Bangladesh as native. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:301124-1 | Strong candidate; keep pending until source sheet/name linkage is reviewed |
| *Carex nubigena* D.Don | Cyperaceae | POWO result identifies *Carex nubigena* as an accepted species; Bangladesh is not shown in the displayed distribution excerpt. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:301252-1 | Pending |
| *Carex phacota* Spreng. | Cyperaceae | POWO accepted; Bangladesh is not listed in the displayed native distribution. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:301544-1 | Pending |
| *Carex scitula* Boott | Cyperaceae | POWO accepted; displayed native range is Arunachal Pradesh (Mishmi Hills), not Bangladesh. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:302161-1 | Pending; scrutinize historical sheet determination |
| *Carex teinogyna* Boott | Cyperaceae | POWO accepted; synonymizes *Carex scabriculmis* and *C. teinogyna* var. *scabriculmis*. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:302566-1 | Pending |
| *Carex thomsonii* Boott | Cyperaceae | Name appears in POWO's accepted *Carex* species list, but an individual taxon page was not independently checked in this pass. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:330029-2 | Pending; individual taxon-page check required |
| *Carex vesiculosa* Boott | Cyperaceae | POWO accepted; Bangladesh is not listed in the displayed native distribution. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:302894-1 | Pending |
| *Cyperus flexuosus* Vahl | Cyperaceae | POWO treats this name as a synonym of *Cyperus ferax*. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:74713-2 | Preserve source spelling; do not add as an accepted taxon without resolving the synonym and the article's usage |
| *Cyperus castaneus* Willd. | Cyperaceae | POWO accepted; Bangladesh is not listed in the displayed native distribution. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:304068-1 | Pending |
| *Fimbristylis eragrostis* (Nees) Hance | Cyperaceae | POWO accepted; Bangladesh is not listed in the displayed native distribution. https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:307885-1 | Pending |

## Important interpretation limits

1. The BNH article's 12 taxa are published as new Bangladesh flora additions based on CAL sheets. The historical collection metadata and exact sheet images should be checked before a stronger specimen-level claim is made.
2. POWO's absence of Bangladesh from a displayed distribution is not proof of absence and does not negate the cited historical Bangladesh collection.
3. *Cyperus flexuosus* is a POWO synonym of *C. ferax*. Keep the article's verbatim name in the source-evidence record and store the accepted-name relationship separately after checking the original taxonomic treatment.
4. Do not invent Bengali common names. Use “সাধারণ নাম উল্লেখ নেই” until a traceable Bangladesh vernacular-name source is found.
5. Keep all 12 proposed rows out of the public catalogue until the family placement, source citation, accepted-name relationship, and source-specific occurrence note are represented in the data model.
6. No existing catalogue record was changed and no review status was promoted in this batch.

## Next review actions

- Retrieve CAL specimen images or accession-level records for the cited Griffith collections and verify locality transcription.
- Independently resolve all 12 names against a recorded WCVP/POWO release, especially *Cyperus flexuosus* and *Carex thomsonii*.
- If admitted, add a distinct occurrence-evidence record and keep the verbatim source name separate from the accepted taxon name.
