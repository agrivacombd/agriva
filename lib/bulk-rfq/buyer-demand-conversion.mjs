const BUYER_TYPES = new Set(["individual", "business"]);
const VISIBILITIES = new Set(["public", "private"]);
const ISO_DATE = /^\\d{4}-\\d{2}-\\d{2}$/;

export function buildBuyerDemandRfqDraft(demand, choices, now = new Date()) {
  if (!demand || !choices) throw new TypeError("Demand and buyer choices are required");
  if (demand.status !== "active") throw new Error("DEMAND_NOT_ACTIVE");
  if (demand.response_deadline && ISO_DATE.test(demand.response_deadline)) {
    const today = now.toISOString().slice(0, 10);
    if (demand.response_deadline < today) throw new Error("DEMAND_EXPIRED");
  }
  if (!BUYER_TYPES.has(choices.buyer_type)) throw new Error("INVALID_BUYER_TYPE");
  if (!VISIBILITIES.has(choices.visibility)) throw new Error("INVALID_VISIBILITY");
  if (typeof choices.quote_deadline !== "string" || !Number.isFinite(Date.parse(choices.quote_deadline)) ||
      Date.parse(choices.quote_deadline) <= now.getTime()) {
    throw new Error("INVALID_QUOTE_DEADLINE");
  }
  const quantity = Number(demand.quantity);
  const productName = typeof demand.crop_name === "string" ? demand.crop_name.trim() : "";
  const unit = typeof demand.unit === "string" ? demand.unit.trim() : "";
  const district = typeof demand.district === "string" ? demand.district.trim() : "";
  const upazila = typeof demand.upazila === "string" ? demand.upazila.trim() : "";
  if (productName.length < 2 || productName.length > 120 ||
      !Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000 ||
      unit.length < 1 || unit.length > 30 || /[\\x00-\\x1f<>]/.test(unit) || unit === "__custom__" ||
      district.length > 80 || upazila.length > 80) {
    throw new Error("INVALID_DEMAND_FIELDS");
  }
  return Object.freeze({
    buyer_type: choices.buyer_type,
    visibility: choices.visibility,
    product_name: productName,
    specification: "",
    quantity,
    unit,
    district,
    upazila,
    desired_date: demand.need_mode === "specific_date" && ISO_DATE.test(demand.need_date ?? "")
      ? demand.need_date : null,
    quote_deadline: new Date(choices.quote_deadline).toISOString(),
  });
}
