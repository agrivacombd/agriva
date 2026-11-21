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
const raw = JSON.parse(await fs.readFile(path.join(root, "barc-crop-suitability-api-raw.json"), "utf8"));
const crosswalk = JSON.parse(await fs.readFile(path.join(root, "barc-crop-suitability-crosswalk.json"), "utf8"));
const manifest = JSON.parse(await fs.readFile(path.join(root, "barc-crop-suitability-api-manifest.json"), "utf8"));

const byName = new Map();
const directory = new Map();
for (const item of raw) {
  const upazila = item.upazila;
  const code = String(upazila.upazila_code);
  directory.set(code, { code, district: upazila.district_name, upazila: upazila.thana_name });
  for (const record of item.records || []) {
    if (!record.crop_name) continue;
    if (!byName.has(record.crop_name)) {
      byName.set(record.crop_name, {
        cropName: record.crop_name, cropIds: new Set(), codes: new Set(),
        seasons: new Set(), recordCount: 0,
      });
    }
    const entry = byName.get(record.crop_name);
    entry.cropIds.add(String(record.crop_id));
    entry.codes.add(code);
    if (record.crop_season) entry.seasons.add(record.crop_season);
    entry.recordCount += 1;
  }
}

const crops = [...byName.values()].map((entry) => ({
  cropName: entry.cropName,
  cropIds: [...entry.cropIds].sort((a, b) => Number(a) - Number(b)),
  codes: [...entry.codes].sort(),
  upazilaCount: entry.codes.size,
  seasons: [...entry.seasons].sort(),
  recordCount: entry.recordCount,
}));
const clusters = new Map();
for (const crop of crops) {
  const signature = crop.codes.join(",");
  if (!clusters.has(signature)) clusters.set(signature, []);
  clusters.get(signature).push(crop);
}
const rankedClusters = [...clusters.entries()]
  .map(([signature, entries]) => ({ signature, entries }))
  .sort((a, b) => b.entries.length - a.entries.length);
const main = rankedClusters[0];
const mainCodes = main.signature ? main.signature.split(",") : [];
const mapping = new Map(crosswalk.mapping.map(([code, id]) => [String(code), id]));
const matchedCodes = mainCodes.filter((code) => mapping.has(code));
const unmatchedCodes = mainCodes.filter((code) => !mapping.has(code));
const outsideMain = [...directory.values()].filter((entry) => !mainCodes.includes(entry.code));
const cropSummary = (entry) => ({
  cropName: entry.cropName,
  cropIds: entry.cropIds,
  upazilaCount: entry.upazilaCount,
  seasons: entry.seasons,
  recordCount: entry.recordCount,
});

const boroDashboardClassesHa = [4118560, 2224969, 1227522, 203541, 2316663];
const boroApiRows = raw.flatMap((item) => (item.records || []).map((record) => ({
  upazila: item.upazila,
  ...record,
}))).filter((record) => Number(record.crop_id) === 1);
const areaFields = ["vs", "s", "ms", "ls", "ns"];
const boroApiClasses = areaFields.map((field) =>
  boroApiRows.reduce((sum, record) => sum + Number(record[field] || 0), 0),
);
const boroApiTotal = boroApiClasses.reduce((sum, value) => sum + value, 0);
const boroDashboardTotal = boroDashboardClassesHa.reduce((sum, value) => sum + value, 0);

const result = {
  classification: "API crop-name and geographic coverage audit; coverage clusters are not an official crop master list",
  capturedAtUtc: manifest.summary.retrieved_at_utc,
  source: manifest.summary.api_base,
  officialReference: {
    annualReport: "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2026/9/cae1a14a-896a-4f97-b1c8-76a13fab40a6.pdf",
    annualReportPeriod: "2025-2026",
    annualReportPublished: "October 2026",
    annualReportCoverage: "BARC reports 76 crop suitability assessments completed in 30 additional upazilas during FY 2025-26, bringing cumulative coverage to 479 of 495 upazilas (annual report pp. 6 and 9).",
    projectPage: "https://portal.cropzoning.gov.bd/aboutProject",
    projectPageCoverage: "The project page currently states 76 crops across 464 of 495 upazilas.",
  },
  apiInventory: {
    distinctCropNameCount: crops.length,
    distinctCropIdCount: new Set(crops.flatMap((entry) => entry.cropIds)).size,
    upazilaDirectoryCount: directory.size,
    totalSuitabilityRecords: raw.reduce((sum, item) => sum + (item.records || []).length, 0),
  },
  areaUnitCrossCheck: {
    dashboardSource: "https://dashboard.cropzoning.gov.bd/",
    dashboardUnitLabel: "Area [ha]",
    crop: "Boro dhan",
    cropId: 1,
    situation: "Favourable Environment",
    season: "Rabi",
    apiRecordCount: boroApiRows.length,
    classFieldOrder: areaFields,
    apiClassTotals: boroApiClasses,
    apiTotal: boroApiTotal,
    dashboardClassTotalsHa: boroDashboardClassesHa,
    dashboardTotalHa: boroDashboardTotal,
    totalDifference: boroApiTotal - boroDashboardTotal,
    totalDifferencePercent: Number(((boroApiTotal - boroDashboardTotal) / boroDashboardTotal * 100).toFixed(3)),
    interpretation: "The API class totals are close to the official dashboard's hectare totals (0.272% total difference), strongly suggesting the API fields are area in hectares. However, the values do not match exactly and the API payload has no unit metadata; treat hectares as a high-confidence hypothesis, not a BARC-confirmed unit.",
  },
  largestIdenticalCoverageCluster: {
    cropCount: main.entries.length,
    upazilaCodeCount: mainCodes.length,
    matchedAgrivaUpazilaCount: matchedCodes.length,
    unmatchedApiLocationCount: unmatchedCodes.length,
    unmatchedApiLocations: unmatchedCodes.map((code) => directory.get(code) || { code }),
    cropNames: main.entries.map((entry) => entry.cropName).sort(),
    caveat: "This 76-name cluster is identified only by identical API coverage in this capture. BARC has not confirmed that these names constitute the final 76-crop assessment inventory.",
  },
  coverageCountDistribution: Object.fromEntries(
    [...new Set(crops.map((entry) => entry.upazilaCount))]
      .sort((a, b) => a - b)
      .map((count) => [String(count), crops.filter((entry) => entry.upazilaCount === count).length]),
  ),
  additionalCropLabels: crops.filter((entry) => !main.entries.some((core) => core.cropName === entry.cropName))
    .map(cropSummary).sort((a, b) => a.upazilaCount - b.upazilaCount || a.cropName.localeCompare(b.cropName)),
  apiDirectoryEntriesOutsideLargestCluster: outsideMain,
  reconciliation: {
    latestAnnualReportClaim: "479 upazilas",
    apiLargestClusterMappedToAgriva: matchedCodes.length,
    apiLargestClusterIncludesNonUpazilaEntries: unmatchedCodes.length,
    discrepancy: "The API's largest identical-coverage cluster maps to 480 AGRIVA upazila records, one more than BARC's FY 2025-26 annual-report figure of 479. The API directory also includes two city-corporation entries. The project page's 464 figure is older/different. Confirm assessment vintage and boundary treatment with BARC.",
  },
  limitations: [
    "Do not treat the largest coverage cluster as an official BARC crop master list until BARC confirms it.",
    "The API returns 95 crop labels and 140 crop IDs; crop IDs are not one-to-one with crop names.",
    "The fields vs, s, ms, ls and ns do not expose their unit in the inspected payload.",
    "No suitability values are published by this audit; it only describes coverage and identifiers.",
  ],
};

const outputPath = path.join(root, "barc-crop-suitability-crop-inventory-audit.json");
await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({
  outputPath,
  distinctCropNames: result.apiInventory.distinctCropNameCount,
  distinctCropIds: result.apiInventory.distinctCropIdCount,
  largestClusterCropCount: result.largestIdenticalCoverageCluster.cropCount,
  largestClusterUpazilas: result.largestIdenticalCoverageCluster.upazilaCodeCount,
  matchedAgrivaUpazilas: result.largestIdenticalCoverageCluster.matchedAgrivaUpazilaCount,
  additionalCropLabels: result.additionalCropLabels.length,
  outsideCluster: result.apiDirectoryEntriesOutsideLargestCluster,
}, null, 2));
