import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

/**
 * Ensure a cookie-backed Supabase identity exists for cart ownership.
 * Visitors receive a buyer-only anonymous auth identity; no signup, password,
 * social provider or SMS OTP is required. The database still validates auth.uid(),
 * inventory, cart ownership and guest-only buyer permissions.
 */
export async function resolveMarketplaceCartUser(): Promise<{ supabase: ReturnType<typeof createSupabaseBrowserClient>; user: User }> {
  const supabase = createSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError && !isMissingSessionError(sessionError)) throw sessionError;

  if (!sessionData.session?.user || sessionError) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error("Guest checkout session could not be created.");
    return { supabase, user: data.user };
  }

  // Validate/refresh both regular and anonymous sessions before cart operations.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError && !isMissingSessionError(userError)) throw userError;
  if (!userData.user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error("Guest checkout session could not be created.");
    return { supabase, user: data.user };
  }

  return { supabase, user: userData.user };
}

export function isMissingSessionError(error: { name?: string; code?: string; message?: string } | null) {
  if (!error) return false;
  return error.name === "AuthSessionMissingError"
    || ["session_not_found", "refresh_token_not_found", "invalid_refresh_token"].includes(error.code || "")
    || /^(?:auth session missing|invalid refresh token|refresh token not found)(?::|$)/i.test(error.message || "");
}
