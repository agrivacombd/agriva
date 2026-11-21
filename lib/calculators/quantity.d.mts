export type AreaUnit = "acre" | "hectare" | "decimal";
export const AREA_TO_ACRES: Readonly<Record<AreaUnit, number>>;
export function toPositiveNumber(value: string | number): number;
export function convertAreaToAcres(area: string | number, unit: AreaUnit): number;
export function calculateRequiredQuantity(area: string | number, unit: AreaUnit, rateKgPerAcre: string | number): number;
