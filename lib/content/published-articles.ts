import { createClient } from "@supabase/supabase-js";

export type PublishedContentArticle = {
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  body_markdown: string | null;
  updated_at: string;
};

const validSlug = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9\u0980-\u09ff]+(?:-[a-z0-9\u0980-\u09ff]+)*$/.test(value);

function publicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function getPublishedContentArticles(): Promise<PublishedContentArticle[]> {
  const supabase = publicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_drafts")
    .select("slug,title,meta_title,meta_description,body_markdown,updated_at")
    .eq("status", "published")
    .eq("content_type", "article")
    .not("slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (error || !data) return [];

  return (data as PublishedContentArticle[]).filter(
    (article) => validSlug(article.slug) && typeof article.title === "string" && article.title.trim().length > 0,
  );
}

export async function getPublishedContentArticleBySlug(slug: string): Promise<PublishedContentArticle | null> {
  if (!validSlug(slug)) return null;
  const supabase = publicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("content_drafts")
    .select("slug,title,meta_title,meta_description,body_markdown,updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("content_type", "article")
    .maybeSingle();

  if (error || !data || !validSlug(data.slug) || typeof data.title !== "string" || !data.title.trim()) return null;
  return data as PublishedContentArticle;
}
