import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-locations";

/**
 * Existing 64-district reference lists stable numeric district IDs.
 * Derive division from the selected district rather than asking buyers twice.
 * Mymensingh became a separate division, despite these districts retaining
 * their original numeric positions within the older Dhaka reference group.
 */
export function getBangladeshDivisionForDistrict(districtName: string): string | null {
  const district = BANGLADESH_DISTRICTS.find(item => item.name === districtName.trim());
  if (!district) return null;

  const id = Number(district.id);
  if (!Number.isSafeInteger(id) || id < 1 || id > 64) return null;
  if ([5, 10, 13, 16].includes(id)) return "ময়মনসিংহ";
  if (id <= 17) return "ঢাকা";
  if (id <= 25) return "রাজশাহী";
  if (id <= 33) return "রংপুর";
  if (id <= 40) return "বরিশাল";
  if (id <= 50) return "চট্টগ্রাম";
  if (id <= 54) return "সিলেট";
  return "খুলনা";
}
