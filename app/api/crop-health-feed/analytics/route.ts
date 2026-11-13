import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

// Aggregates consented public entries only; never reads private diagnosis records.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("crop_health_feed").select("crop,district,confidence,published_at").limit(10000);
  if (error) return NextResponse.json({ error: "পরিসংখ্যান পাওয়া যায়নি।" }, { status: 503 });
  const rows = data || [];
  const aggregate = (key: "crop" | "district" | "confidence") => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = row[key] || "অনির্দিষ্ট";
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  };
  return NextResponse.json({
    sampleSize: rows.length,
    byCrop: aggregate("crop"),
    // Suppress small district groups to reduce re-identification risk.
    byDistrict: aggregate("district").filter((item) => item.count >= 5),
    byConfidence: aggregate("confidence"),
    disclaimer: "শুধু স্বেচ্ছায় প্রকাশিত AI বিশ্লেষণের পরিসংখ্যান; নিশ্চিত রোগের হার বা সমগ্র কৃষকসমাজের প্রতিনিধিত্ব নয়।",
  }, { headers: { "Cache-Control": "no-store" } });
}
