export type WholesalerSupplyListing = {
  id: string; crop_name: string; variety: string | null; quantity: number;
  unit: "kg" | "maund" | "ton" | "bag"; price_per_unit: number;
  district: string; upazila: string | null; quality: string | null;
  harvest_ready: "ready_now" | "within_7_days" | "later";
  minimum_order: number | null; negotiable: boolean; transport_available: boolean;
  created_at: string;
};
export type WholesalerDemandTarget = { crop_name: string; district: string };
export type WholesalerSupplyMatch = WholesalerSupplyListing & {
  matchReasons: ("crop" | "district")[]; score: number;
};
export function rankWholesalerSupplyMatches(
  listings: WholesalerSupplyListing[], demandTargets: WholesalerDemandTarget[], limit?: number
): WholesalerSupplyMatch[];
