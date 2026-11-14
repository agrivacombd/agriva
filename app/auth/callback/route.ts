import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeAuthNextPath } from "@/lib/auth/safe-next";
import { fillMissingSocialProfileName } from "@/lib/auth/social-profile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error && data.user) {
    try {
      // A new social user gets their Google/Facebook display name. Do not
      // overwrite names AGRIVA users already entered themselves.
      await fillMissingSocialProfileName(supabase, data.user);
    } catch (cause) {
      // Profile enrichment is optional; don't block a valid OAuth login.
      console.error("Social profile name sync failed:", cause instanceof Error ? cause.name : "unknown");
    }
  }
  const next = safeAuthNextPath(url.searchParams.get("next"));
  return NextResponse.redirect(new URL(error ? "/login?error=auth_callback" : next, url.origin));
}
