# Plant Science Catalogue: data model and verification policy

## Purpose

The catalogue is a Bangladesh-focused learning and reference resource. A listed name is not automatically an accepted name, nor does a global accepted-name record prove that a taxon occurs in Bangladesh.

## Current implementation

- `app/learn/plant-science/plants.ts` is the single source of truth for the current 1,905 display records.
- `PlantScienceClient.tsx` consumes that shared module; it no longer embeds a second copy of the catalogue.
- Each record retains the six original source/display fields: Bengali name, English name, scientific name as supplied, family as supplied, source/group label, and source note.
- URL slugs are deterministic derivatives of the scientific name. They are identifiers for routing only, not taxonomic identifiers.
- Every imported record currently has `taxonomicReviewStatus: "pending"`. Do not change this to reviewed without recorded name-backbone and Bangladesh-occurrence evidence.
- `scripts/smoke-plant-science-catalog.mjs` checks the reviewed baseline count, required fields, exact scientific-name duplicates, slug collisions, and shared-module usage.

## Initial data-quality findings

- The extracted catalogue currently contains 1,905 records, 1,905 unique exact scientific-name strings, 215 distinct family labels, and no deterministic URL-slug collisions after hybrid notation is normalized.
- A first field-alignment issue was found: an entry had `Achira` in the scientific-name field and `Canna edulis` in the family field. It was corrected to retain `Canna edulis` as the source scientific name, `Cannaceae` as family, and a clear review note. Kew POWO treats `Canna edulis` as a synonym of accepted `Canna indica`; the Bangladesh occurrence evidence for this record remains pending.
- The catalogue includes a mixture of vascular plants, fern allies, bryophytes, algae/cyanobacteria labels, crop entries and ornamental/horticultural records. These should not all be presented as a single count of accepted vascular plant species. A future `organism_group` and `record_scope` field should make this explicit.
- The current `group` field is a learning/use category, not a taxonomic rank. Do not use it as a family or taxonomic classification.
- Family count from the current file is a count of distinct supplied labels, not a vetted national family total.

## Recommended normalized domain model

Keep nomenclatural names, accepted taxa, Bangladesh occurrence evidence, and source citations as separate entities. This avoids treating an old checklist name as a current accepted taxon or treating a global distribution as a Bangladesh record.

### plant_taxa

- `id` UUID primary key
- `slug` unique stable URL slug
- `accepted_name_id` FK to plant_names; nullable until reviewed
- `rank` (species, subspecies, variety, etc.)
- `family_name` and higher classification fields, with classification source/version
- `taxonomic_status` (pending, accepted, synonym, unresolved, excluded)
- `native_status_bd` (native, endemic, introduced, cultivated, uncertain)
- `reviewed_at`, `reviewed_by`, `review_note`

### plant_names

- `id` UUID primary key
- `scientific_name` exact source spelling
- `normalized_name` for exact-match indexing only
- `authorship` nullable
- `name_role` (accepted, synonym, unresolved, misapplied, orthographic_variant)
- `accepted_taxon_id` nullable FK to plant_taxa
- `taxonomic_backbone`, `backbone_release`, `backbone_id`
- `source_name_verbatim` preserves what the source actually printed

### plant_local_names

- `id`, `taxon_id`, `language_code`, `name`, `locality`, `source_id`
- Never invent Bengali or English common names. Unknown names remain explicitly unknown.

### plant_occurrences_bd

- `id`, `taxon_id`, `evidence_type` (herbarium_specimen, published_checklist, field_observation, database_distribution)
- `institution_code`, `catalog_number`, `collector`, `collection_date`
- `locality_verbatim`, `district`, `habitat`, `latitude`, `longitude`
- `source_id`, `verification_status`
- Distinguish specimen-backed occurrence from checklist inclusion and global distribution.

### plant_sources and plant_taxon_sources

- Source bibliographic title, institution/author, publication year, URL/DOI, access date, source version, licence, page/table/record locator.
- Link sources to names, taxa, family placements, local names and occurrence evidence with a claim type and short evidence note.
- Retain a source snapshot/version where possible so future reviews can reproduce decisions.

## Taxonomy and occurrence policy

1. Preserve the Bangladesh source name exactly as printed.
2. Reconcile names against the current World Checklist of Vascular Plants / Plants of the World Online backbone and record the backbone release and identifier.
3. Use Bangladesh checklist literature and herbarium specimen records to establish Bangladesh inclusion; a global accepted-name record alone is insufficient.
4. If sources disagree, retain the competing usages and mark the record unresolved pending expert review. Do not silently overwrite the family or scientific name.
5. Track native, endemic, introduced and cultivated status separately; do not infer status from presence alone.
6. Publish species detail pages only when a record has enough reviewed content to be useful. Keep pending records in the main searchable catalogue but do not generate thin indexable pages for them.
7. Show visible source citations and a last-reviewed date on public detail pages.

## Reference sources and scope

- Checklist of Vascular Plants of Bangladesh (CVPB): a Bangladesh checklist compiled from taxonomic literature and specimen numbers; its About page reports 4,754 species, 1,709 genera and 234 families. The project describes this as an evolving checklist, not a final immutable flora.
- 2026 vascular plant checklist abstract: reports approximately 5,131 species, including native, endemic and introduced taxa. This count has a different scope and should not be mixed directly with the 4,754-species CVPB count without comparing inclusion criteria.
- Kew WCVP / POWO: global vascular plant nomenclatural and taxonomic backbone, including accepted-name and synonym relationships. Record release/version and identifier because taxonomy changes.
- Bangladesh National Herbarium and Bangladesh Forest Department plant identification resources: use specimen/catalogue evidence where available; distinguish specimen records from species totals.

## Publication gates for indexable species pages

A species page should be indexable only after:
- scientific name and rank are reconciled against a recorded backbone release;
- accepted name or unresolved status is explicit;
- family placement is source-backed;
- Bangladesh presence is supported by a Bangladesh checklist or occurrence evidence;
- source references and evidence notes are visible;
- page content contains useful species-specific information beyond the name and family.

Until then, the record remains searchable in the hub with a clear "taxonomy review pending" label. No fabricated descriptions, uses, distribution, conservation status or common names.
