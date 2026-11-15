import { createSupabaseServerClient } from "@/lib/supabase/server";
import MicrosoftClarityClient from "./MicrosoftClarityClient";

/**
 * The narrowly scoped RPC exposes only the public Clarity ID.
 * All admin integration config remains protected by existing RLS.
 */
export default async function MicrosoftClarity() {
  let projectId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_enabled_clarity_project_id");
    if (!error && typeof data === "string" && /^[a-z0-9]{6,24}$/i.test(data)) {
      projectId = data;
    }
  } catch {
    // Missing migration or Supabase downtime must never block the storefront.
  }

  return projectId ? <MicrosoftClarityClient projectId={projectId} /> : null;
}
