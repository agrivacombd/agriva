import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/lib/auth/safe-next";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Post-login role lookup failed:", profileError.code);
    return NextResponse.json({ error: "Unable to verify account role" }, { status: 503 });
  }

  const requestedNext = new URL(request.url).searchParams.get("next");
  const destination = profile?.role === "admin"
    ? "/admin"
    : safeAuthNextPath(requestedNext);

  return NextResponse.json({ redirectTo: destination }, {
    headers: { "Cache-Control": "no-store" },
  });
}
