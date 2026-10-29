import { NextResponse } from "next/server";

// Farmer crop sales belong on Sell Harvest. Marketplace catalogue submissions
// are handled by the seller-only endpoint.
export async function POST() {
  return NextResponse.json({
    error: "Farmers should list harvested crops on /sell-harvest. Marketplace product submissions require a seller role.",
  }, { status: 410 });
}
