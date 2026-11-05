-- Public readers may see only approved-for-publication article rows and their public-facing fields.
-- Revoke inherited anonymous write/read privileges before granting the narrow public projection.
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
