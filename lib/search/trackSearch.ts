import { createClient } from "@supabase/supabase-js";

export async function trackSearch(query: string, sessionId?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  await supabase.rpc("track_search", {
    p_query: query,
    p_session_id: sessionId ?? null,
  });
}
