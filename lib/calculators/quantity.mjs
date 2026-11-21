/**
 * Shared quantity math for AGRIVA seed and fertilizer calculators.
 * Area input may be acres, hectares, or decimals; rate is always kg per acre.
 */
export const AREA_TO_ACRES = Object.freeze({
  acre: 1,
  hectare: 2.47105,
  decimal: 0.01,
});

export function toPositiveNumber(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function convertAreaToAcres(area, unit) {
  const factor = AREA_TO_ACRES[unit];
  if (factor === undefined) throw new RangeError(`Unsupported area unit: ${unit}`);
  const acres = toPositiveNumber(area) * factor;
  return Number.isFinite(acres) ? acres : 0;
}

export function calculateRequiredQuantity(area, unit, rateKgPerAcre) {
  const quantity = convertAreaToAcres(area, unit) * toPositiveNumber(rateKgPerAcre);
  return Number.isFinite(quantity) ? quantity : 0;
}
