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

export function isMissingSessionError(error: { name?: string; code?: string } | null) {
  return error?.name === "AuthSessionMissingError" || error?.code === "session_not_found";
}
