import { NextResponse } from "next/server";

// AGRIVA's current launch mode is Cash on Delivery. This generic endpoint does
// not implement any payment provider's official signature contract and does not
// reconcile currency/amount against the canonical order. Keep it inert until a
// provider-specific verifier and order reconciliation flow have been reviewed.
export async function POST() {
  return NextResponse.json(
    { error: "Online payment webhooks are not enabled." },
    { status: 503 },
  );
}
