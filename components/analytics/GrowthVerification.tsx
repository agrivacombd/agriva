import { createSupabaseServerClient } from "@/lib/supabase/server";

const verificationMeta: Record<string, { name: string; key: string }> = {
  google_search_console: { name: "google-site-verification", key: "token" },
  bing_webmaster: { name: "msvalidate.01", key: "token" },
  yandex_webmaster: { name: "yandex-verification", key: "token" },
  pinterest_verification: { name: "p:domain_verify", key: "token" },
  facebook_domain_verification: { name: "facebook-domain-verification", key: "token" },
};

export default async function GrowthVerification() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("site_integrations")
      .select("provider_key,config")
      .eq("category", "verification")
      .eq("enabled", true);
    return <>{(data ?? []).map((item) => {
      const definition = verificationMeta[item.provider_key];
      const token = (item.config as Record<string, unknown> | null)?.[definition?.key ?? "token"];
      if (!definition || typeof token !== "string" || !token || /[<>\u0000-\u001f]/.test(token)) return null;
      return <meta key={item.provider_key} name={definition.name} content={token}/>;
    })}</>;
  } catch {
    return null;
  }
}
