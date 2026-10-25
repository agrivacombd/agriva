-- Enforce content workflow transitions at the database boundary (not just in UI).
CREATE UNIQUE INDEX IF NOT EXISTS content_drafts_article_slug_unique
  ON public.content_drafts (slug)
  WHERE content_type = 'article' AND slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_content_draft_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'draft' AND NEW.status = 'review')
      OR (OLD.status = 'review' AND NEW.status IN ('draft', 'approved', 'rejected'))
      OR (OLD.status = 'approved' AND NEW.status IN ('review', 'published'))
      OR (OLD.status = 'rejected' AND NEW.status = 'draft')
    ) THEN
      RAISE EXCEPTION 'Invalid content workflow transition: % -> %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF OLD.status = 'published' AND (
    NEW.title IS DISTINCT FROM OLD.title
    OR NEW.slug IS DISTINCT FROM OLD.slug
    OR NEW.body_markdown IS DISTINCT FROM OLD.body_markdown
    OR NEW.meta_title IS DISTINCT FROM OLD.meta_title
    OR NEW.meta_description IS DISTINCT FROM OLD.meta_description
  ) THEN
    RAISE EXCEPTION 'Published content must return to review before edits'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status IN ('approved', 'published') THEN
    IF nullif(trim(NEW.title), '') IS NULL
      OR length(trim(NEW.title)) > 160
      OR NEW.slug IS NULL
      OR trim(NEW.slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      OR length(trim(NEW.slug)) > 180
      OR nullif(trim(NEW.body_markdown), '') IS NULL THEN
      RAISE EXCEPTION 'Title, valid slug, and article body are required for approval/publication'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_drafts_workflow_guard ON public.content_drafts;
CREATE TRIGGER content_drafts_workflow_guard
BEFORE UPDATE ON public.content_drafts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_content_draft_workflow();
