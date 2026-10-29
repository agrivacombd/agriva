-- Enforce publication invariants in the database as well as in the API route.
-- RLS UPDATE policies authorize rows, not individual columns or workflow transitions.
CREATE OR REPLACE FUNCTION public.enforce_content_draft_publication()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    IF OLD.status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'Only approved content drafts can be published'
        USING ERRCODE = '55000';
    END IF;

    IF NULLIF(btrim(COALESCE(NEW.title, '')), '') IS NULL
       OR NULLIF(btrim(COALESCE(NEW.body_markdown, '')), '') IS NULL
       OR COALESCE(NEW.slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       OR char_length(NEW.slug) > 180 THEN
      RAISE EXCEPTION 'A published draft requires a title, valid slug, and body'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS content_drafts_publication_invariant ON public.content_drafts;
CREATE TRIGGER content_drafts_publication_invariant
BEFORE UPDATE OF status ON public.content_drafts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_content_draft_publication();

REVOKE ALL ON FUNCTION public.enforce_content_draft_publication() FROM PUBLIC, anon, authenticated;

DO $validation$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'public.content_drafts'::regclass
      AND tgname = 'content_drafts_publication_invariant'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Content draft publication invariant trigger was not installed';
  END IF;
END;
$validation$;
