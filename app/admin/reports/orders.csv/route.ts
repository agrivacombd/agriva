import { NextResponse } from "next/server";
import { authorizePermission } from "@/lib/auth/server-authorization";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

export async function GET(request: Request) {
  const authorization = await authorizePermission("finance.read_scoped");
  if (!authorization.ok) {
    if (authorization.status === 401) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }
  const { supabase } = authorization;

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
