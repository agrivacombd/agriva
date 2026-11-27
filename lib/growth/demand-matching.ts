export type FarmerDemand = {
  id: string;
  crop_name: string;
  quantity: number;
  unit: "kg" | "maund" | "ton" | "bag";
  price_type: "fixed" | "negotiable" | "market";
  target_price: number | null;
  district: string;
  upazila: string | null;
  need_mode: "urgent" | "specific_date" | "date_range" | "flexible";
  need_date: string | null;
  need_start_date: string | null;
  need_end_date: string | null;
  response_deadline: string | null;
  allow_partial: boolean;
  created_at: string;
};
export type DemandMatch = FarmerDemand & { matchReasons: ("crop" | "district")[]; score: number };

const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase("bn-BD")
  .replace(/[।,;:!?()[\]{}]/g, " ").replace(/\s+/g, " ").trim();

export function rankFarmerDemandMatches(
  demands: FarmerDemand[],
  productNames: string[],
  farmerDistrict: string | null,
  limit = 4,
): DemandMatch[] {
  const products = productNames.map(normalize).filter(Boolean);
  const district = farmerDistrict ? normalize(farmerDistrict) : "";
  return demands.flatMap((demand): DemandMatch[] => {
    const crop = normalize(demand.crop_name);
    const cropMatch = !!crop && products.some((product) => product === crop || product.includes(crop) || crop.includes(product));
    const districtMatch = !!district && normalize(demand.district) === district;
    if (!cropMatch && !districtMatch) return [];
    const matchReasons: ("crop" | "district")[] = [];
    if (cropMatch) matchReasons.push("crop");
    if (districtMatch) matchReasons.push("district");
    const score = (cropMatch ? 4 : 0) + (districtMatch ? 2 : 0) + (demand.need_mode === "urgent" ? 1 : 0);
    return [{ ...demand, matchReasons, score }];
  }).sort((a, b) => b.score - a.score || b.created_at.localeCompare(a.created_at)).slice(0, Math.max(0, limit));
}
