import { createClient } from "@supabase/supabase-js";

export type PublishedContentArticle = {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  primary_keyword: string;
  body_markdown: string | null;
  faq: unknown;
  created_at: string;
  updated_at: string;
};

function createPublicContentClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // Intentionally use an anonymous client: public article visibility must not
  // depend on the visitor's signed-in role or carry an admin session.
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

const PUBLIC_ARTICLE_FIELDS =
  "id,title,slug,meta_title,meta_description,primary_keyword,body_markdown,faq,created_at,updated_at";

export async function getPublishedContentArticles(limit = 50) {
  const supabase = createPublicContentClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_drafts")
    .select(PUBLIC_ARTICLE_FIELDS)
    .eq("status", "published")
    .eq("content_type", "article")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    // Keep the existing editorial blog available if the forward migration
    // has not yet been deployed or public read access is temporarily absent.
    console.error("Published content article list unavailable:", error.message);
    return [];
  }

  return (data ?? []) as PublishedContentArticle[];
}

export async function getPublishedContentArticleBySlug(slug: string) {
  const supabase = createPublicContentClient();
  if (!supabase || !slug || slug.length > 180) return null;

  const { data, error } = await supabase
    .from("content_drafts")
    .select(PUBLIC_ARTICLE_FIELDS)
    .eq("status", "published")
    .eq("content_type", "article")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Published content article unavailable:", error.message);
    return null;
  }

  return (data as PublishedContentArticle | null) ?? null;
}
