import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          // Server Components cannot write cookies. Middleware refreshes the
          // session before rendering; this fallback prevents auth refreshes
          // from crashing a read-only Server Component render.
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Expected in Server Components; Route Handlers and Server Actions
            // can write cookies, while middleware persists refreshed sessions.
          }
        },
      },
    }
  );
}
