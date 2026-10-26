import { createCipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function adminRedirect(request: NextRequest, result: string) {
  const url = new URL("/admin/search-intelligence", request.url);
  url.searchParams.set("searchConsole", result);
  return NextResponse.redirect(url);
}

function encryptRefreshToken(token: string, secret: string) {
  const key = createHash("sha256").update(secret, "utf8").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64") };
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return adminRedirect(request, "auth-required");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return adminRedirect(request, "admin-required");

  const cookieState = request.cookies.get("agriva_gsc_oauth_state")?.value;
  const returnedState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const response = adminRedirect(request, "failed");
  response.cookies.set("agriva_gsc_oauth_state", "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/api/admin/search-console/callback", maxAge: 0,
  });

  if (oauthError) {
    response.headers.set("Location", new URL("/admin/search-intelligence?searchConsole=cancelled", request.url).toString());
    return response;
  }
  if (!cookieState || !returnedState || !code) return response;
  const expected = Buffer.from(cookieState);
  const actual = Buffer.from(returnedState);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return response;

  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI;
  const encryptionKey = process.env.GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
    response.headers.set("Location", new URL("/admin/search-intelligence?searchConsole=not-configured", request.url).toString());
    return response;
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return response;
    const tokens: unknown = await tokenResponse.json();
    if (!tokens || typeof tokens !== "object") return response;
    const tokenData = tokens as { refresh_token?: unknown; scope?: unknown; token_type?: unknown };
    if (typeof tokenData.refresh_token !== "string" || !tokenData.refresh_token) {
      response.headers.set("Location", new URL("/admin/search-intelligence?searchConsole=refresh-token-missing", request.url).toString());
      return response;
    }
    const scopes = typeof tokenData.scope === "string" ? tokenData.scope.split(" ").filter(Boolean) : [];
    if (!scopes.includes("https://www.googleapis.com/auth/webmasters.readonly")) return response;

    const encrypted = encryptRefreshToken(tokenData.refresh_token, encryptionKey);
    const { error } = await supabase.from("search_console_connections").upsert({
      connected_by: user.id,
      provider: "google_search_console",
      refresh_token_ciphertext: encrypted.ciphertext,
      refresh_token_iv: encrypted.iv,
      scopes,
      updated_at: new Date().toISOString(),
    }, { onConflict: "connected_by,provider" });
    if (error) {
      response.headers.set("Location", new URL("/admin/search-intelligence?searchConsole=storage-not-ready", request.url).toString());
      return response;
    }
    response.headers.set("Location", new URL("/admin/search-intelligence?searchConsole=connected", request.url).toString());
    return response;
  } catch {
    return response;
  }
}
