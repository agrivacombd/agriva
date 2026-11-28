import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) throw new Error("Missing Supabase environment variables");

// @supabase/ssr caches the browser client for the current browser context.
// Keep one canonical instance so every client component shares the same GoTrueClient.
export const supabase = createBrowserClient(url, key, {
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export function createSupabaseBrowserClient() {
  return supabase;
}
