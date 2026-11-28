export type FarmerDemand = {
  id: string; crop_name: string; quantity: number; unit: "kg" | "maund" | "ton" | "bag";
  price_type: "fixed" | "negotiable" | "market"; target_price: number | null;
  district: string; upazila: string | null;
  need_mode: "urgent" | "specific_date" | "date_range" | "flexible";
  need_date: string | null; need_start_date: string | null; need_end_date: string | null;
  response_deadline: string | null; allow_partial: boolean; created_at: string;
};
export type DemandMatch = FarmerDemand & { matchReasons: ("crop" | "district")[]; score: number };
export function rankFarmerDemandMatches(demands: FarmerDemand[], productNames: string[], farmerDistrict: string | null, limit?: number): DemandMatch[];
