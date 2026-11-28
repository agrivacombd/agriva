export type BuyerDemandForRfq = {
  status: string; response_deadline?: string | null; crop_name: string; quantity: number | string;
  unit: string; district: string; upazila?: string | null; need_mode: string; need_date?: string | null;
  notes?: string | null; target_price?: number | null; contact_phone?: string | null;
};
export type BuyerRfqChoices = {
  buyer_type: "individual" | "business"; visibility: "public" | "private"; quote_deadline: string;
};
export type BuyerDemandRfqDraft = {
  buyer_type: "individual" | "business"; visibility: "public" | "private"; product_name: string;
  specification: string; quantity: number; unit: string; district: string; upazila: string;
  desired_date: string | null; quote_deadline: string;
};
export function buildBuyerDemandRfqDraft(demand: BuyerDemandForRfq, choices: BuyerRfqChoices, now?: Date): BuyerDemandRfqDraft;
