-- Public blog routes use the anon key. Allow only published article rows and public-facing columns.
-- Keep this migration idempotent so environments that replay it alongside later hardening remain safe.
REVOKE ALL ON TABLE public.content_drafts FROM anon;

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

DROP POLICY IF EXISTS content_drafts_public_published_articles_read ON public.content_drafts;
CREATE POLICY content_drafts_public_published_articles_read
  ON public.content_drafts
  FOR SELECT
  TO anon
  USING (status = 'published' AND content_type = 'article');
