-- Keep the public published-article feed subject to the caller's RLS policies.
CREATE OR REPLACE VIEW public.published_articles
WITH (security_invoker = true)
AS
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

-- The view runs with invoker privileges, so grant only the columns it exposes.
GRANT SELECT (
  title,
  slug,
  meta_title,
  meta_description,
  primary_keyword,
  body_markdown,
  created_at,
  updated_at
) ON public.content_drafts TO anon;

-- Published articles are readable by visitors and signed-in users; RLS still
-- restricts rows to published article content.
DROP POLICY IF EXISTS content_drafts_public_published_articles_read
ON public.content_drafts;

CREATE POLICY content_drafts_public_published_articles_read
ON public.content_drafts
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  AND content_type = 'article'
);

REVOKE ALL ON public.published_articles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.published_articles TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
