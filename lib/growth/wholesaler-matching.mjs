const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("bn-BD")
  .replace(/[।,;:!?()[\]{}]/g, " ").replace(/\s+/g, " ").trim();

export function rankWholesalerSupplyMatches(listings, demandTargets, limit = 6) {
  const targets = demandTargets.map((target) => ({
    crop: normalize(target.crop_name),
    district: normalize(target.district),
  })).filter((target) => target.crop || target.district);
  return listings.flatMap((listing) => {
    const crop = normalize(listing.crop_name);
    const district = normalize(listing.district);
    let best = null;
    for (const target of targets) {
      const cropMatch = !!crop && !!target.crop && (crop === target.crop || crop.includes(target.crop) || target.crop.includes(crop));
      const districtMatch = !!district && !!target.district && district === target.district;
      if (!cropMatch && !districtMatch) continue;
      const matchReasons = [];
      if (cropMatch) matchReasons.push("crop");
      if (districtMatch) matchReasons.push("district");
      const score = (cropMatch ? 4 : 0) + (districtMatch ? 2 : 0) + (listing.harvest_ready === "ready_now" ? 1 : 0);
      if (!best || score > best.score) best = { ...listing, matchReasons, score };
    }
    return best ? [best] : [];
  }).sort((a, b) => b.score - a.score || b.created_at.localeCompare(a.created_at)).slice(0, Math.max(0, limit));
}
