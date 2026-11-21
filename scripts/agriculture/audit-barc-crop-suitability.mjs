#!/usr/bin/env node
/**
 * Audits crop-name and upazila coverage patterns in the BARC Agri-Advisory API
 * capture. Coverage clusters are observations, not proof of BARC's official
 * crop inventory. This script never publishes suitability data.
 *
 * Usage: node scripts/agriculture/audit-barc-crop-suitability.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("data/agriculture");
const rawPath = path.join(root, "barc-crop-suitability-api-raw.json");
const crosswalkPath = path.join(root, "barc-crop-suitability-crosswalk.json");
const outputPath = path.join(root, "barc-crop-suitability-crop-inventory-audit.json");
const raw = JSON.parse(await fs.readFile(rawPath, "utf8"));
const crosswalk = JSON.parse(await fs.readFile(crosswalkPath, "utf8"));

const byName = new Map();
const directory = new Map();

for (const item of raw) {
  const upazila = item.upazila;
  const code = String(upazila.upazila_code);
  directory.set(code, {
    code,
    district: upazila.district_name,
    upazila: upazila.thana_name,
  });

  for (const record of item.records || []) {
    const name = record.crop_name;
    if (!name) continue;
    if (!byName.has(name)) {
      byName.set(name, {
        name,
        cropIds: new Set(),
        upazilaCodes: new Set(),
        seasons: new Set(),
        situations: new Set(),
        rows: 0,
      });
    }
    const entry = byName.get(name);
    entry.cropIds.add(String(record.crop_id));
    entry.upazilaCodes.add(code);
    if (record.crop_season) entry.seasons.add(record.crop_season);
    if (record.crop_var) entry.situations.add(record.crop_var);
    entry.rows += 1;
  }
}

const cropCoverage = [...byName.values()].map((entry) => ({
  cropName: entry.name,
  cropIds: [...entry.cropIds].sort((a, b) => Number(a) - Number(b)),
  upazilaCount: entry.upazilaCodes.size,
  upazilaCodes: [...entry.upazilaCodes].sort(),
  seasons: [...entry.seasons].sort(),
  situations: [...entry.situations].sort(),
  recordCount: entry.rows,
})).sort((a, b) => a.cropName.localeCompare(b.cropName));

const byCoverageSignature = new Map();
for (const crop of cropCoverage) {
  const signature = crop.upazilaCodes.join(",");
  if (!byCoverageSignature.has(signature)) byCoverageSignature.set(signature, []);
  byCoverageSignature.get(signature).push(crop.cropName);
}
const coverageClusters = [...byCoverageSignature.entries()]
  .map(([signature, names]) => ({
    cropCount: names.length,
    upazilaCount: signature ? signature.split(",").length : 0,
    cropNames: names.sort(),
    upazilaCodes: signature ? signature.split(",") : [],
  }))
  .sort((a, b) => b.cropCount - a.cropCount || b.upazilaCount - a.upazilaCount);

const commonCluster = coverageClusters[0];
const mapping = new Map(crosswalk.mapping.map(([barcCode, agrivaId]) => [String(barcCode), agrivaId]));
const mappedCommon = commonCluster.upazilaCodes.filter((code) => mapping.has(code));
const unmatchedCommon = commonCluster.upazilaCodes
  .filter((code) => !mapping.has(code))
  .map((code) => directory.get(code) || { code });
const apiDirectoryOutsideCommon = [...directory.values()]
  .filter((entry) => !commonCluster.upazilaCodes.includes(entry.code));

const result = {
  classification: "API crop-name and geographic coverage audit; coverage clusters are not an official crop master list",
  capturedAtUtc: "2026-11-21T20:48:20Z",
  source: "https://api1.cropzoning.gov.bd",
  officialReference: {
    annualReport: "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2026/9/cae1a14a-896a-4f97-b1c8-76a13fab40a6.pdf",
    annualReportPeriod: "2025-2026",
    annualReportPublished: "October 2026",
    annualReportCoverage: "BARC reports 76 crop suitability assessments completed in 30 additional upazilas during FY 2025-26, bringing cumulative coverage to 479 of 495 upazilas (annual report pp. 6 and 9).",
    projectPage: "https://portal.cropzoning.gov.bd/aboutProject",
    projectPageCoverage: "The project page currently states 76 crops across 464 of 495 upazilas.",
  },
  apiInventory: {
    distinctCropNameCount: cropCoverage.length,
    distinctCropIdCount: new Set([...byName.values()].flatMap((entry) => [...entry.cropIds])).size,
    upazilaDirectoryCount: directory.size,
    totalSuitabilityRecords: raw.reduce((sum, item) => sum + (item.records || []).length, 0),
  },
  largestIdenticalCoverageCluster: {
    cropCount: commonCluster.cropCount,
    upazilaCodeCount: commonCluster.upazilaCount,
    matchedAgrivaUpazilaCount: mappedCommon.length,
    unmatchedApiLocationCount: unmatchedCommon.length,
    unmatchedApiLocations: unmatchedCommon,
    cropNames: commonCluster.cropNames,
    caveat: "This 76-name cluster is identified only by identical API coverage in this capture. BARC has not confirmed that these names constitute the final 76-crop assessment inventory.",
  },
  apiDirectoryEntriesOutsideLargestCluster: apiDirectoryOutsideCommon,
  coverageClusters: coverageClusters.map(({ cropCount, upazilaCount, cropNames }) => ({
    cropCount,
    upazilaCount,
    cropNames,
  })),
  cropCoverage,
  reconciliation: {
    latestAnnualReportClaim: "479 upazilas",
    apiLargestClusterMappedToAgriva: mappedCommon.length,
    apiLargestClusterIncludesNonUpazilaEntries: unmatchedCommon.length,
    discrepancy: "The API's largest identical-coverage cluster maps to 480 AGRIVA upazila records, one more than BARC's FY 2025-26 annual-report figure of 479. The API directory also includes two city-corporation entries. The project page's 464 figure is older/different. Confirm assessment vintage and boundary treatment with BARC.",
  },
  limitations: [
    "Do not treat the largest coverage cluster as an official BARC crop master list until BARC confirms it.",
    "The API returns 95 crop labels and 140 crop IDs; crop IDs are not one-to-one with crop names.",
    "The fields vs, s, ms, ls and ns do not expose their unit in the inspected payload.",
    "No suitability values are published by this audit; it only describes coverage and identifiers.",
  ],
};

await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({
  outputPath,
  distinctCropNames: result.apiInventory.distinctCropNameCount,
  distinctCropIds: result.apiInventory.distinctCropIdCount,
  largestClusterCropCount: result.largestIdenticalCoverageCluster.cropCount,
  largestClusterUpazilas: result.largestIdenticalCoverageCluster.upazilaCodeCount,
  matchedAgrivaUpazilas: result.largestIdenticalCoverageCluster.matchedAgrivaUpazilaCount,
  outsideCluster: result.apiDirectoryEntriesOutsideLargestCluster,
}, null, 2));
