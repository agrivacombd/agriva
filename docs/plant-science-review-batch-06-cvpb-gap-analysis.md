# Plant-science review batch 06 — CVPB family-level gap analysis

## Purpose

This batch begins a source-led expansion plan toward the 5,000-record catalogue target. It does **not** add speculative taxa. It compares the current catalogue's family-label counts with the published CVPB family totals to prioritize a taxon-by-taxon crosswalk.

## Baseline

- Current AGRIVA catalogue: 1,905 display records, 1,905 unique exact scientific-name strings.
- Current family-label counts in `plants.ts`: Fabaceae 183; Poaceae 134; Orchidaceae 35; Rubiaceae 61.
- The labels are preserved source/display values; they are not guaranteed to use the same circumscription or accepted taxonomy as CVPB.
- CVPB reports 4,754 taxa overall (4,629 species, 39 subspecies, 86 varieties), across 234 families and 1,709 genera.
- The CVPB paper reports the four largest families as Fabaceae 405 taxa, Poaceae 300, Orchidaceae 232, and Rubiaceae 223.

## Prioritized gap signals

| Family | AGRIVA current label count | CVPB published taxa | Raw difference | Priority |
|---|---:|---:|---:|---|
| Fabaceae | 183 | 405 | 222 | 1 |
| Poaceae | 134 | 300 | 166 | 2 |
| Orchidaceae | 35 | 232 | 197 | 3 |
| Rubiaceae | 61 | 223 | 162 | 4 |

**Important:** the raw differences are triage signals only, not counts of missing species. CVPB totals include infraspecific taxa; family circumscriptions, synonyms, horticultural/cultivated entries, and AGRIVA's mixed-source coverage may differ. Do not turn these differences directly into catalogue rows or claim the resulting totals are missing Bangladesh species.

## Evidence inspected

1. CVPB home/category index exposes 202 angiosperm family categories, 9 gymnosperm families, and 23 pteridophyte families. The index provides navigable family pages.
2. CVPB family pages for Poaceae, Fabaceae, Orchidaceae, and Rubiaceae expose family checklist entries and, where extracted, voucher/reference context. The browser text extraction currently collapses the long family body into a truncated single line; it is insufficient for a reliable full-name crosswalk.
3. CVPB's About page explains that its checklist was assembled from floristic literature, taxonomic papers, specimen numbers, and POWO name information. This supports use as a national checklist reference, but each record still needs a traceable per-taxon citation.
4. BNH's specimen database describes accession-level herbarium records and field metadata. It is a useful independent route for specimen verification, not a substitute for accepted-name reconciliation.

## Batch 06 decision

- No new plant rows are added in this reconnaissance pass.
- No current row is promoted from pending to reviewed.
- No family totals are rewritten to match CVPB.
- Next data-ingestion pass should obtain the complete CVPB records for one prioritized family at a time, preserve the CVPB verbatim name, vernacular name, family, voucher/reference, and source URL, then reconcile exact-name duplicates and synonyms against the existing 1,905 rows and a versioned taxonomic backbone.
- Start with Fabaceae, then Poaceae, Orchidaceae, and Rubiaceae. For each proposed addition, require both (a) Bangladesh checklist/specimen evidence and (b) an independently checked accepted-name/synonym decision. Keep unresolved records in a candidate queue rather than publishing them as verified.

## Sources

- CVPB live checklist: https://eflorabd.natureinfo.com.bd/
- CVPB About: https://eflorabd.natureinfo.com.bd/about/
- CVPB 2026 paper (family totals and methodology): https://innspub.net/the-checklist-of-vascular-plants-of-bangladesh-cvpb-a-dynamic-web-based-plant-database-for-botanical-exploration/
- CVPB Poaceae family page: https://eflorabd.natureinfo.com.bd/category/angiosperms/liliospsida-monocots/poaceae/
- CVPB Fabaceae family page: https://eflorabd.natureinfo.com.bd/category/angiosperms/magnoliopsida-dicots/fabaceae/
- CVPB Orchidaceae family page: https://eflorabd.natureinfo.com.bd/category/angiosperms/liliospsida-monocots/orchidaceae/
- CVPB Rubiaceae family page: https://eflorabd.natureinfo.com.bd/category/angiosperms/magnoliopsida-dicots/rubiaceae/
- BNH Plant Specimen Database: https://plantsp-eflora.bnh.gov.bd/
