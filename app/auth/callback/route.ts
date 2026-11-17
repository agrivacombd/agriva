import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeAuthNextPath } from "@/lib/auth/safe-next";
import { fillMissingSocialProfileName } from "@/lib/auth/social-profile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(new URL("/login?error=provider_denied", url.origin));
  }
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));

  // Persist PKCE session cookies on the redirect response itself. This ensures
  // the browser receives the session before it requests the protected dashboard.
  const next = safeAuthNextPath(url.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, url.origin));
  response.headers.set("Cache-Control", "private, no-store");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/login?error=auth_unavailable", url.origin));
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user || !data.session) {
      console.error("OAuth code exchange failed:", error?.code || "missing_session");
      return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
    }
    try {
      await fillMissingSocialProfileName(supabase, data.user);
    } catch (cause) {
      console.error("Social profile name sync failed:", cause instanceof Error ? cause.name : "unknown");
    }
    return response;
  } catch (cause) {
    console.error("OAuth callback exception:", cause instanceof Error ? cause.name : "unknown");
    return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
  }
}
