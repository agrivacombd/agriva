import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase.from("marketplace_orders")
    .select("id,created_at,status,payment_status,payment_method,total_amount,quantity")
    .order("created_at", { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: "Could not load order report" }, { status: 500 });

  const header = ["order_id","created_at","status","payment_status","payment_method","total_amount_bdt","quantity"];
  const rows = (data ?? []).map(row => [
    row.id,row.created_at,row.status,row.payment_status,row.payment_method,row.total_amount,row.quantity,
  ].map(csvCell).join(","));
  const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
  return new NextResponse("\uFEFF" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agriva-orders-report.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
