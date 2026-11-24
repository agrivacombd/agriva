import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const verificationMeta: Record<string, { name: string; key: string }> = {
  google_search_console: { name: "google-site-verification", key: "token" },
  bing_webmaster: { name: "msvalidate.01", key: "token" },
  yandex_webmaster: { name: "yandex-verification", key: "token" },
  pinterest_verification: { name: "p:domain_verify", key: "token" },
  facebook_domain_verification: { name: "facebook-domain-verification", key: "token" },
};

// Verification tokens are public metadata and do not depend on a user's session.
// Cache them to avoid querying Supabase on every page request.
const getVerificationRows = unstable_cache(
  async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [] as { provider_key: string; config: unknown }[];

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("site_integrations")
      .select("provider_key,config")
      .eq("category", "verification")
      .eq("enabled", true);
    if (error) throw error;
    return (data ?? []) as { provider_key: string; config: unknown }[];
  },
  ["agriva-growth-verification-meta"],
  { revalidate: 600 }
);

export default async function GrowthVerification() {
  let rows: { provider_key: string; config: unknown }[] = [];
  try {
    rows = await getVerificationRows();
  } catch {
    return null;
  }

  return <>{rows.map((item) => {
    const definition = verificationMeta[item.provider_key];
    const token = (item.config as Record<string, unknown> | null)?.[definition?.key ?? "token"];
    if (!definition || typeof token !== "string" || !token || /[<>\\u0000-\\u001f]/.test(token)) return null;
    return <meta key={item.provider_key} name={definition.name} content={token} />;
  })}</>;
}
