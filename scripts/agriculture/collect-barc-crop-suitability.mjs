#!/usr/bin/env node
/**
 * Collects the public BARC Agri-Advisory Portal crop-suitability API response.
 *
 * This is an evidence-collection script only. It does not publish records to the
 * AGRIVA UI, infer missing assessments, or claim that every returned crop is
 * part of BARC's separately reported 76-crop final assessment inventory.
 *
 * Usage:
 *   node scripts/agriculture/collect-barc-crop-suitability.mjs
 *   BARC_API_DELAY_MS=1200 node scripts/agriculture/collect-barc-crop-suitability.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = (process.env.BARC_API_BASE || "https://api1.cropzoning.gov.bd").replace(/\/$/, "");
const DELAY_MS = Math.max(250, Number(process.env.BARC_API_DELAY_MS || 1000));
const OUTPUT_DIR = path.resolve("data/agriculture");
const RAW_PATH = path.join(OUTPUT_DIR, "barc-crop-suitability-api-raw.json");
const SUMMARY_PATH = path.join(OUTPUT_DIR, "barc-crop-suitability-api-summary.json");
const AREA_FIELDS = ["vs", "s", "ms", "ls", "ns"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(endpoint) {
  let lastError;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "AGRIVA-BARC-data-audit/1.0",
          Referer: "https://portal.cropzoning.gov.bd/cropSuitability",
        },
        signal: AbortSignal.timeout(45_000),
      });
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("retry-after") || 0);
        await sleep(Math.max(retryAfter * 1000, (attempt + 1) * 5000));
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${endpoint}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 5) await sleep((attempt + 1) * 2000);
    }
  }
  throw lastError || new Error(`Unable to retrieve ${endpoint}`);
}

function numericAreaProblems(record, upazilaCode) {
  return AREA_FIELDS.flatMap((field) => {
    const rawValue = record[field];
    const value = typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string" && rawValue.trim() !== ""
        ? Number(rawValue)
        : Number.NaN;
    return Number.isFinite(value) && value >= 0
      ? []
      : [{ upazilaCode, cropId: record.crop_id, field, value: rawValue }];
  });
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const districts = await getJson("/api/crop-suitability-districts");
const upazilas = [];

for (const [index, district] of districts.entries()) {
  const districtUpazilas = await getJson(
    `/api/crop-suitability-upazilas/${encodeURIComponent(district.district_c)}`,
  );
  for (const upazila of districtUpazilas) {
    upazilas.push({
      ...upazila,
      district_code: district.district_c,
      district_name: district.district_n,
      district_name_bn: district.dist_name_bn,
    });
  }
  if ((index + 1) % 8 === 0 || index === districts.length - 1) {
    console.log(`Directory: ${index + 1}/${districts.length} districts; ${upazilas.length} upazilas`);
  }
  await sleep(DELAY_MS);
}

const results = [];
for (const [index, upazila] of upazilas.entries()) {
  let records = [];
  let error = null;
  try {
    records = await getJson(
      `/api/crop-suitability/${encodeURIComponent(upazila.upazila_code)}`,
    );
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }
  results.push({ upazila, records, error });
  if ((index + 1) % 25 === 0 || index === upazilas.length - 1) {
    const rowCount = results.reduce((sum, item) => sum + item.records.length, 0);
    const errorCount = results.filter((item) => item.error).length;
    console.log(`Suitability: ${index + 1}/${upazilas.length}; rows ${rowCount}; errors ${errorCount}`);
  }
  await sleep(DELAY_MS);
}

const flatRecords = results.flatMap(({ upazila, records }) =>
  records.map((record) => ({ upazila, ...record })),
);
const cropNames = [...new Set(flatRecords.map((record) => record.crop_name).filter(Boolean))].sort();
const cropIds = [...new Set(flatRecords.map((record) => record.crop_id))].sort((a, b) => Number(a) - Number(b));
const seasons = [...new Set(flatRecords.map((record) => record.crop_season).filter(Boolean))].sort();
const keyCounts = new Map();
const invalidAreaValues = [];

for (const record of flatRecords) {
  const key = [
    record.upazila.upazila_code,
    record.crop_id,
    record.crop_season,
    record.crop_var,
  ].join("|");
  keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
  invalidAreaValues.push(...numericAreaProblems(record, record.upazila.upazila_code));
}

const summary = {
  classification: "BARC Agri-Advisory Portal API response; not reconciled with the final 76-crop assessment inventory",
  capturedAt: new Date().toISOString(),
  apiBase: API_BASE,
  endpoints: [
    "/api/crop-suitability-districts",
    "/api/crop-suitability-upazilas/{district_code}",
    "/api/crop-suitability/{upazila_code}",
  ],
  districtCount: districts.length,
  upazilaDirectoryCount: upazilas.length,
  upazilasWithRecords: results.filter((item) => item.records.length > 0).length,
  upazilasWithoutRecords: results.filter((item) => item.records.length === 0).length,
  apiErrors: results.filter((item) => item.error).map((item) => ({
    upazilaCode: item.upazila.upazila_code,
    district: item.upazila.district_name,
    upazila: item.upazila.thana_name,
    error: item.error,
  })),
  suitabilityRecordCount: flatRecords.length,
  uniqueCropNameCount: cropNames.length,
  cropNames,
  distinctCropIdCount: cropIds.length,
  cropIds,
  seasons,
  areaFields: AREA_FIELDS,
  invalidAreaValueCount: invalidAreaValues.length,
  invalidAreaValues,
  duplicateCompositeKeyCount: [...keyCounts.values()].filter((count) => count > 1).length,
  caveats: [
    "The API directory count differs from the project page's reported 464-upazila final assessment coverage.",
    "The API crop-name inventory must be reconciled with the project page's reported 76 crops before production use.",
    "The API payload inspected did not declare the unit for vs/s/ms/ls/ns; do not label these values as hectares without BARC confirmation.",
    "BARC upazila codes differ from AGRIVA administrative IDs; join only through the reviewed crosswalk.",
    "Suitability class area is not a yield forecast or profitability score.",
  ],
};

await fs.writeFile(RAW_PATH, JSON.stringify(results));
await fs.writeFile(SUMMARY_PATH, JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify({
  rawPath: RAW_PATH,
  summaryPath: SUMMARY_PATH,
  districtCount: summary.districtCount,
  upazilaDirectoryCount: summary.upazilaDirectoryCount,
  suitabilityRecordCount: summary.suitabilityRecordCount,
  uniqueCropNameCount: summary.uniqueCropNameCount,
  invalidAreaValueCount: summary.invalidAreaValueCount,
  apiErrorCount: summary.apiErrors.length,
}, null, 2));
