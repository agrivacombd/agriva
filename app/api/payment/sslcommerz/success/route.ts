import { NextResponse } from "next/server";

function disabled() {
  return NextResponse.json(
    { error: "Online payments are disabled. Please use Cash on Delivery." },
    { status: 410 },
  );
}

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}
