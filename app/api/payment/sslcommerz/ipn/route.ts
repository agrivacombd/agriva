import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Online payments are disabled. Please use Cash on Delivery." },
    { status: 410 },
  );
}
