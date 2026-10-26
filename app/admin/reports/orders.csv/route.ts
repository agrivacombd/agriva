import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);

  // Quoting a CSV field does not prevent spreadsheet formula evaluation.
  // Prefix potentially dangerous leading characters so exported text is inert
  // when opened in common spreadsheet applications.
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return '"' + text.replace(/"/g, '""') + '"';
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 });
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
