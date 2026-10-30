import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AuthErrorLike = { code?: unknown; message?: unknown };

function isInvalidRefreshToken(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as AuthErrorLike;
  const code = typeof candidate.code === "string" ? candidate.code.toLowerCase() : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return code === "refresh_token_not_found" ||
    code === "invalid_refresh_token" ||
    code === "invalid_grant" ||
    /invalid refresh token|refresh token (not found|expired)/i.test(message);
}

function clearSupabaseAuthCookies(request: NextRequest): NextResponse {
  const authCookieNames = request.cookies.getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .map((cookie) => cookie.name);

  authCookieNames.forEach((name) => request.cookies.delete(name));
  const response = NextResponse.next({ request });
  authCookieNames.forEach((name) => response.cookies.delete(name));
  return response;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        // Keep the request cookie view in sync so server components in this
        // request see the refreshed session.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refresh expired auth tokens before Server Components render. A revoked or
  // malformed refresh token cannot be refreshed; clear only Supabase auth
  // cookies so every subsequent request does not retry the same invalid token.
  try {
    const { error } = await supabase.auth.getUser();
    if (isInvalidRefreshToken(error)) response = clearSupabaseAuthCookies(request);
  } catch (error) {
    if (isInvalidRefreshToken(error)) clearSupabaseAuthCookies(request, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
