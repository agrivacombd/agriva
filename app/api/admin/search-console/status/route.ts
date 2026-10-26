import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
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
    return NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const requirements = [
    { key: "GOOGLE_SEARCH_CONSOLE_CLIENT_ID", label: "Google OAuth Client ID" },
    { key: "GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET", label: "Google OAuth Client Secret" },
    { key: "GOOGLE_SEARCH_CONSOLE_REDIRECT_URI", label: "OAuth callback URL" },
    { key: "GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY", label: "Token encryption key" },
  ];
  const missing = requirements.filter(({ key }) => !process.env[key]).map(({ key, label }) => ({ key, label }));

  let connectionState: "not_connected" | "connected" = "not_connected";
  if (missing.length === 0) {
    const { data: connection, error: connectionError } = await supabase
      .from("search_console_connections")
      .select("id,connected_at,property_url")
      .eq("connected_by", user.id)
      .eq("provider", "google_search_console")
      .maybeSingle();
    if (!connectionError && connection) connectionState = "connected";
  }

  return NextResponse.json({
    provider: "google_search_console",
    configured: missing.length === 0,
    connectionState,
    missing,
    metricsAvailable: false,
    message: missing.length
      ? "OAuth setup is incomplete. No Google Search Console metrics are being fetched."
      : connectionState === "connected"
        ? "Google authorization is stored encrypted. Property verification and metric sync are not implemented yet."
        : "OAuth configuration is present. Connect an admin Google account before metrics can be fetched.",
  }, { headers: { "Cache-Control": "no-store" } });
}
