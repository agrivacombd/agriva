import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Identify guests before attempting a network getUser() request.
 * getSession() is used only to choose the UI; the cart RPC still enforces
 * server-side auth, inventory and ownership. Never authorize with getSession().
 */
export async function resolveMarketplaceCartUser() {
  const supabase = createSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError && !isMissingSessionError(sessionError)) throw sessionError;
  if (!sessionData.session?.user || sessionData.session.user.is_anonymous) {
    return { supabase, user: null };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError && !isMissingSessionError(userError)) throw userError;
  return {
    supabase,
    user: userData.user && !userData.user.is_anonymous ? userData.user : null,
  };
}

export function isMissingSessionError(error: { name?: string; code?: string; message?: string } | null) {
  // A previously signed-in browser can have an expired or revoked refresh token.
  // These errors mean authentication is no longer usable; invite sign-in again.
  // Do NOT treat network timeouts, 5xx errors or other authentication failures as guests.
  if (!error) return false;
  return error.name === "AuthSessionMissingError"
    || ["session_not_found", "refresh_token_not_found", "invalid_refresh_token"].includes(error.code || "")
    || /^(?:auth session missing|invalid refresh token|refresh token not found)(?::|$)/i.test(error.message || "");
}
