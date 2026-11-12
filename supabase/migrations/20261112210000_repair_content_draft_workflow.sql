-- Forward-only repair for environments where historical content workflow migrations
-- were not applied. No historical migration history is rewritten.
-- Existing draft rows are preserved; guard is applied to future updates.
CREATE UNIQUE INDEX IF NOT EXISTS content_drafts_article_slug_unique
  ON public.content_drafts (slug)
  WHERE content_type = 'article' AND slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.content_draft_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.content_drafts(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  status_before text NOT NULL,
  status_after text NOT NULL
);
CREATE INDEX IF NOT EXISTS content_draft_revisions_draft_changed_idx
  ON public.content_draft_revisions (draft_id, changed_at DESC);
ALTER TABLE public.content_draft_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.content_draft_revisions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.content_draft_revisions TO authenticated;
DROP POLICY IF EXISTS content_draft_revisions_admin_read ON public.content_draft_revisions;
CREATE POLICY content_draft_revisions_admin_read ON public.content_draft_revisions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'::public.user_role
  ));

CREATE OR REPLACE FUNCTION public.enforce_content_draft_workflow()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'draft' AND NEW.status = 'review')
      OR (OLD.status = 'review' AND NEW.status IN ('draft','approved','rejected'))
      OR (OLD.status = 'approved' AND NEW.status IN ('review','published'))
      OR (OLD.status = 'rejected' AND NEW.status = 'draft')
      OR (OLD.status = 'published' AND NEW.status = 'review')
    ) THEN
      RAISE EXCEPTION 'Invalid content workflow transition: % -> %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.status = 'published' AND (
      NEW.title IS DISTINCT FROM OLD.title OR NEW.slug IS DISTINCT FROM OLD.slug
      OR NEW.body_markdown IS DISTINCT FROM OLD.body_markdown
      OR NEW.meta_title IS DISTINCT FROM OLD.meta_title
      OR NEW.meta_description IS DISTINCT FROM OLD.meta_description
    ) THEN
      RAISE EXCEPTION 'Unpublish first; edit content after it returns to review'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.status IN ('approved','rejected') THEN
      NEW.reviewed_by := auth.uid();
      NEW.reviewed_at := now();
    ELSIF NEW.status IN ('draft','review') THEN
      NEW.reviewed_by := NULL;
      NEW.reviewed_at := NULL;
    ELSIF NEW.status = 'published' THEN
      NEW.reviewed_at := now();
    END IF;
  ELSIF OLD.status = 'published' AND (
    NEW.title IS DISTINCT FROM OLD.title OR NEW.slug IS DISTINCT FROM OLD.slug
    OR NEW.body_markdown IS DISTINCT FROM OLD.body_markdown
    OR NEW.meta_title IS DISTINCT FROM OLD.meta_title
    OR NEW.meta_description IS DISTINCT FROM OLD.meta_description
  ) THEN
    RAISE EXCEPTION 'Published content must return to review before edits'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status IN ('approved','published') AND (
    nullif(trim(NEW.title),'') IS NULL OR length(trim(NEW.title)) > 160
    OR NEW.slug IS NULL OR trim(NEW.slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    OR length(trim(NEW.slug)) > 180
    OR nullif(trim(NEW.body_markdown),'') IS NULL
  ) THEN
    RAISE EXCEPTION 'Title, valid slug, and article body are required for approval/publication'
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_content_draft_workflow() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS content_drafts_workflow_guard ON public.content_drafts;
CREATE TRIGGER content_drafts_workflow_guard BEFORE UPDATE ON public.content_drafts
FOR EACH ROW EXECUTE FUNCTION public.enforce_content_draft_workflow();

CREATE OR REPLACE FUNCTION public.capture_content_draft_revision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF ROW(OLD.title, OLD.slug, OLD.meta_title, OLD.meta_description,
         OLD.body_markdown, OLD.status, OLD.reviewed_by, OLD.reviewed_at)
     IS DISTINCT FROM
     ROW(NEW.title, NEW.slug, NEW.meta_title, NEW.meta_description,
         NEW.body_markdown, NEW.status, NEW.reviewed_by, NEW.reviewed_at) THEN
    INSERT INTO public.content_draft_revisions
      (draft_id, snapshot, changed_by, status_before, status_after)
    VALUES (
      OLD.id,
      jsonb_build_object(
        'title',OLD.title,'slug',OLD.slug,'meta_title',OLD.meta_title,
        'meta_description',OLD.meta_description,'body_markdown',OLD.body_markdown,
        'status',OLD.status::text,'reviewed_by',OLD.reviewed_by,
        'reviewed_at',OLD.reviewed_at,'updated_at',OLD.updated_at
      ),
      auth.uid(), OLD.status::text, NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_content_draft_revision() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS content_draft_revision_capture ON public.content_drafts;
CREATE TRIGGER content_draft_revision_capture BEFORE UPDATE ON public.content_drafts
FOR EACH ROW EXECUTE FUNCTION public.capture_content_draft_revision();
