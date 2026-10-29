import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client for trusted provider callbacks and other narrowly
 * scoped server-to-database operations. Never import this module into client UI.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service-role configuration is missing");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
