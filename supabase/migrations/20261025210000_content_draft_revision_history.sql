-- Keep immutable before-images for content-draft edits and moderation transitions.
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
REVOKE ALL ON TABLE public.content_draft_revisions FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.content_draft_revisions FROM authenticated;
GRANT SELECT ON TABLE public.content_draft_revisions TO authenticated;

DROP POLICY IF EXISTS content_draft_revisions_admin_read ON public.content_draft_revisions;
CREATE POLICY content_draft_revisions_admin_read
  ON public.content_draft_revisions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::public.user_role
  ));

CREATE OR REPLACE FUNCTION public.capture_content_draft_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF ROW(
    OLD.title, OLD.slug, OLD.meta_title, OLD.meta_description,
    OLD.body_markdown, OLD.status, OLD.reviewed_by, OLD.reviewed_at
  ) IS DISTINCT FROM ROW(
    NEW.title, NEW.slug, NEW.meta_title, NEW.meta_description,
    NEW.body_markdown, NEW.status, NEW.reviewed_by, NEW.reviewed_at
  ) THEN
    INSERT INTO public.content_draft_revisions (
      draft_id, snapshot, changed_by, status_before, status_after
    ) VALUES (
      OLD.id,
      jsonb_build_object(
        'title', OLD.title,
        'slug', OLD.slug,
        'meta_title', OLD.meta_title,
        'meta_description', OLD.meta_description,
        'body_markdown', OLD.body_markdown,
        'status', OLD.status::text,
        'reviewed_by', OLD.reviewed_by,
        'reviewed_at', OLD.reviewed_at,
        'updated_at', OLD.updated_at
      ),
      auth.uid(),
      OLD.status::text,
      NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_content_draft_revision() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS content_draft_revision_capture ON public.content_drafts;
CREATE TRIGGER content_draft_revision_capture
BEFORE UPDATE ON public.content_drafts
FOR EACH ROW
EXECUTE FUNCTION public.capture_content_draft_revision();
