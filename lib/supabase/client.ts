import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables");
}

// Use the same cookie-backed browser session as the login flow and server client.
// A plain @supabase/supabase-js client keeps its own localStorage session and can
// incorrectly report a signed-in user as logged out when the app uses SSR cookies.
export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey, {
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
