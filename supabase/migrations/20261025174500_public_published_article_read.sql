-- Public blog routes use the anon key. Allow only published article rows and only public-facing columns.
-- Keep editorial planning fields and reviewer/creator identifiers unavailable to anonymous clients.
REVOKE SELECT ON TABLE public.content_drafts FROM anon;

GRANT SELECT (
  title,
  slug,
  meta_title,
  meta_description,
  primary_keyword,
  body_markdown,
  created_at,
  updated_at,
  content_type,
  status
) ON TABLE public.content_drafts TO anon;

CREATE POLICY content_drafts_public_published_articles_read
  ON public.content_drafts
  FOR SELECT
  TO anon
  USING (status = 'published' AND content_type = 'article');
