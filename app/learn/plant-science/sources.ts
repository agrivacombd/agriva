/**
 * Curated source registry for the AGRIVA plant-science catalogue.
 *
 * Registry entries describe candidate reference sources, not proof that every
 * catalogue row is supported by every source. Per-taxon claims must be linked
 * explicitly before publication.
 */
export type PlantSource = {
  id: string;
  title: string;
  publisher: string;
  year: number | null;
  url: string;
  scope: "bangladesh_occurrence" | "global_taxonomy" | "national_reference" | "preliminary_checklist";
  permittedClaims: string[];
  limitations: string[];
};

export const plantSources: PlantSource[] = [
  {
    id: "cvpb-2026",
    title: "The checklist of vascular plants of Bangladesh (CVPB): A dynamic web-based plant database for botanical exploration",
    publisher: "Journal of Biodiversity and Environmental Sciences; Md. Salah Uddin and Shaikh Bokhtear Uddin",
    year: 2026,
    url: "https://innspub.net/the-checklist-of-vascular-plants-of-bangladesh-cvpb-a-dynamic-web-based-plant-database-for-botanical-exploration/",
    scope: "bangladesh_occurrence",
    permittedClaims: ["Bangladesh vascular-plant checklist inclusion", "published checklist taxonomy and vernacular-name claims when the exact record is cited"],
    limitations: ["The paper reports 4,754 taxa (4,629 species, 39 subspecies and 86 varieties), not 4,754 species.", "The underlying compilation describes sources consulted up to 2024; verify the live database for later changes.", "A checklist entry is not a substitute for a specimen citation when specimen-level evidence is claimed."]
  },
  {
    id: "cvpb-live",
    title: "Checklist of Vascular Plants of Bangladesh",
    publisher: "CVPB; compiled by Md. Salah Uddin and authenticated by Shaikh Bokhtear Uddin",
    year: null,
    url: "https://eflorabd.natureinfo.com.bd/",
    scope: "bangladesh_occurrence",
    permittedClaims: ["Exact taxon inclusion in the live Bangladesh vascular-plant checklist", "family placement as displayed by the checklist"],
    limitations: ["Record the access date and exact taxon page or record locator.", "The site describes 4,754 species/taxa at the time of its About-page snapshot; use the paper's precise taxonomic breakdown when reporting totals."]
  },
  {
    id: "powo-wcvp",
    title: "Plants of the World Online / World Checklist of Vascular Plants",
    publisher: "Royal Botanic Gardens, Kew",
    year: null,
    url: "https://powo.science.kew.org/about-wcvp",
    scope: "global_taxonomy",
    permittedClaims: ["Accepted-name status", "synonymy", "global taxonomic placement", "global distribution as explicitly listed"],
    limitations: ["Global taxonomy or distribution alone does not establish occurrence in Bangladesh.", "Record the access date and taxon page; WCVP/POWO is continuously updated."]
  },
  {
    id: "bnh-specimens",
    title: "Plant Specimen Database Program",
    publisher: "Bangladesh National Herbarium",
    year: null,
    url: "https://plantsp-eflora.bnh.gov.bd/",
    scope: "bangladesh_occurrence",
    permittedClaims: ["Specimen-backed Bangladesh occurrence when the accession or catalogue record is cited", "verbatim locality, collector and collection metadata shown by the record"],
    limitations: ["A database hit must be checked at the individual specimen-record level.", "Do not infer current accepted taxonomy from an unreviewed specimen name."]
  },
  {
    id: "bfd-psim",
    title: "Plant Species Identification Module",
    publisher: "Bangladesh Forest Department and Bangladesh National Herbarium, with FAO technical assistance",
    year: 2018,
    url: "https://bfis.bforest.gov.bd/TreeInfo/public/",
    scope: "national_reference",
    permittedClaims: ["Identification descriptions and national reference information when the exact species page is cited"],
    limitations: ["The displayed database scope and counts are not a complete national flora checklist.", "Do not use the module's total as a national species total."]
  },
  {
    id: "vascular-checklist-abstract-2026",
    title: "A Checklist for the Vascular Plants of Bangladesh (conference abstract)",
    publisher: "Korean Society of Plant Taxonomy conference archive; Md. Salah Uddin and co-authors",
    year: 2026,
    url: "https://pltaxa.or.kr/board/GREENNOTICE/article/272054",
    scope: "preliminary_checklist",
    permittedClaims: ["A preliminary conference abstract reports approximately 5,131 vascular plant species, 1,730 genera and 235 families."],
    limitations: ["Treat as a preliminary conference abstract, not as a fully reconciled replacement dataset.", "Do not mix its approximate species figure with CVPB's taxon count without explaining scope and date."]
  }
];

export const plantSourceById = Object.fromEntries(
  plantSources.map((source) => [source.id, source])
) as Record<string, PlantSource>;
