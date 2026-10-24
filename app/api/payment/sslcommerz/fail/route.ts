import { NextResponse } from "next/server";

// AGRIVA launch policy: Cash on Delivery only. Keep legacy gateway callbacks
// inert so an unsolicited provider callback cannot change an order's state.
export async function GET() {
  return NextResponse.json({ error: "Online payments are not enabled. Please use Cash on Delivery." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Online payments are not enabled. Please use Cash on Delivery." }, { status: 410 });
}
