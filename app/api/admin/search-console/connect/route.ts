import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 });
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI;
  if (!clientId || !redirectUri || !process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET ||
      !process.env.GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.json({ error: "Search Console OAuth configuration is incomplete" }, { status: 503 });
  }

  const state = randomBytes(32).toString("base64url");
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.searchParams.set("client_id", clientId);
  target.searchParams.set("redirect_uri", redirectUri);
  target.searchParams.set("response_type", "code");
  target.searchParams.set("scope", "https://www.googleapis.com/auth/webmasters.readonly");
  target.searchParams.set("access_type", "offline");
  target.searchParams.set("prompt", "consent");
  target.searchParams.set("include_granted_scopes", "true");
  target.searchParams.set("state", state);

  const response = NextResponse.redirect(target);
  response.cookies.set("agriva_gsc_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/search-console/callback",
    maxAge: 10 * 60,
  });
  return response;
}
