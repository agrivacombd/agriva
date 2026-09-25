import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) { const form = await request.formData(); const id = String(form.get("tran_id") || "").replace(/^AGRIVA-/, ""); return NextResponse.redirect(new URL(`/order/${id}?payment=success`, request.url)); }
export async function GET(request: NextRequest) { const id = new URL(request.url).searchParams.get("tran_id")?.replace(/^AGRIVA-/, "") || ""; return NextResponse.redirect(new URL(`/order/${id}?payment=success`, request.url)); }
