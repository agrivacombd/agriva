/**
 * Supabase public read-only credentials shared by AGRIVA's product search.
 *
 * Hosting services do not share environment variables: Netlify deploy
 * previews need their own variables even when Vercel has working credentials.
 * Only anon/publishable credentials are allowed here; never fall back to a
 * service-role/secret key.
 */
export type PublicCatalogConfig = {
  url: string;
  key: string;
};

export function resolvePublicCatalogConfig(
  env: Record<string, string | undefined> = process.env,
): PublicCatalogConfig | null {
  const rawUrl = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").trim();
  const key = (
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();

  if (!rawUrl || !key) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
      parsed.search || parsed.hash || parsed.pathname !== "/") return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}
