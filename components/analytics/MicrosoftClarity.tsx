import { createSupabaseServerClient } from "@/lib/supabase/server";
import MicrosoftClarityClient from "./MicrosoftClarityClient";

/**
 * Only the public Clarity project ID is exposed to the browser.
 * The dedicated SELECT policy permits reading this one enabled provider, not
 * the other admin-managed integrations or their configuration.
 */
export default async function MicrosoftClarity() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_integrations")
      .select("config")
      .eq("provider_key", "microsoft_clarity")
      .eq("category", "analytics")
      .eq("enabled", true)
      .maybeSingle();
    if (error || !data) return null;
    const id = (data.config as Record<string, unknown> | null)?.project_id;
    if (typeof id !== "string" || !/^[a-z0-9]{6,24}$/i.test(id)) return null;
    return <MicrosoftClarityClient projectId={id} />;
  } catch {
    // Missing migration or Supabase downtime must never block the storefront.
    return null;
  }
}
