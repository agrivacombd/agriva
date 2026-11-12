-- Monotonic version token for compare-and-swap article edits.
ALTER TABLE public.content_drafts ADD COLUMN IF NOT EXISTS editorial_version bigint NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.bump_content_draft_editorial_version()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  NEW.editorial_version := OLD.editorial_version + 1;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bump_content_draft_editorial_version() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS content_draft_editorial_version_bump ON public.content_drafts;
CREATE TRIGGER content_draft_editorial_version_bump BEFORE UPDATE ON public.content_drafts
FOR EACH ROW EXECUTE FUNCTION public.bump_content_draft_editorial_version();
