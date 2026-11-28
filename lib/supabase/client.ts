// Backwards-compatible client entrypoint. All browser Supabase access must use
// the @supabase/ssr singleton so auth state is not split across GoTrueClient instances.
export { supabase } from "@/lib/supabase/browser";
