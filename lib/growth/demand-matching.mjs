const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("bn-BD")
  .replace(/[।,;:!?]/g, " ").replace(/\s+/g, " ").trim();

export function rankFarmerDemandMatches(demands, productNames, farmerDistrict, limit = 4) {
  const products = productNames.map(normalize).filter(Boolean);
  const district = farmerDistrict ? normalize(farmerDistrict) : "";
  return demands.flatMap((demand) => {
    const crop = normalize(demand.crop_name);
    const cropMatch = !!crop && products.some((product) => product === crop || product.includes(crop) || crop.includes(product));
    const districtMatch = !!district && normalize(demand.district) === district;
    if (!cropMatch && !districtMatch) return [];
    const matchReasons = [];
    if (cropMatch) matchReasons.push("crop");
    if (districtMatch) matchReasons.push("district");
    const score = (cropMatch ? 4 : 0) + (districtMatch ? 2 : 0) + (demand.need_mode === "urgent" ? 1 : 0);
    return [{ ...demand, matchReasons, score }];
  }).sort((a, b) => b.score - a.score || b.created_at.localeCompare(a.created_at)).slice(0, Math.max(0, limit));
}
