-- Expose only published article fields through a dedicated read-only view.
-- The view owner performs the underlying read, avoiding broad anon table grants.
CREATE OR REPLACE VIEW public.published_articles AS
SELECT
  title,
  slug,
  meta_title,
  meta_description,
  primary_keyword,
  body_markdown,
  created_at,
  updated_at
FROM public.content_drafts
WHERE status = 'published'
  AND content_type = 'article';

REVOKE ALL ON public.published_articles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.published_articles TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
