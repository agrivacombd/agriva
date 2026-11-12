-- Forward-only editorial provenance. Existing published content remains readable;
-- new publication transitions require verified evidence, byline and image.
ALTER TABLE public.content_drafts
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS hero_image_width integer,
  ADD COLUMN IF NOT EXISTS hero_image_height integer,
  ADD COLUMN IF NOT EXISTS hero_image_alt text,
  ADD COLUMN IF NOT EXISTS claim_evidence jsonb NOT NULL DEFAULT '[]'::jsonb;
-- Never infer published_at from created_at: historical publication time is unknown.
CREATE OR REPLACE FUNCTION public.enforce_article_publication_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE evidence jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' OR NEW.published_at IS NOT NULL THEN
      RAISE EXCEPTION 'New articles must enter the editorial draft workflow'
        USING ERRCODE='check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'published' AND NEW.status = 'review' THEN
    NEW.published_at := NULL;
  END IF;
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    IF NEW.published_at IS NOT NULL THEN
      RAISE EXCEPTION 'Publication timestamp must be set by the database'
        USING ERRCODE='check_violation';
    END IF;
    IF nullif(btrim(NEW.author_name),'') IS NULL OR NEW.author_verified_by IS NULL
       OR nullif(btrim(NEW.reviewer_name),'') IS NULL OR NEW.reviewed_by IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM public.profiles p
         WHERE p.id = NEW.author_verified_by AND p.role = 'admin'::public.user_role
       )
       OR NOT EXISTS (
         SELECT 1 FROM public.profiles p
         WHERE p.id = NEW.reviewed_by AND p.role = 'admin'::public.user_role
       ) THEN
      RAISE EXCEPTION 'Verified author and admin reviewer required before publication'
        USING ERRCODE='check_violation';
    END IF;
    IF NEW.hero_image_url !~ '^https://[^[:space:]]+$'
       OR coalesce(NEW.hero_image_width,0) < 1200
       OR coalesce(NEW.hero_image_height,0) < 630
       OR nullif(btrim(NEW.hero_image_alt),'') IS NULL THEN
      RAISE EXCEPTION 'A reviewed high-resolution HTTPS hero image and alt text are required'
        USING ERRCODE='check_violation';
    END IF;
    IF jsonb_typeof(NEW.claim_evidence) <> 'array'
       OR jsonb_array_length(NEW.claim_evidence) = 0 THEN
      RAISE EXCEPTION 'Claim-by-claim source review is required'
        USING ERRCODE='check_violation';
    END IF;
    FOR evidence IN SELECT value FROM jsonb_array_elements(NEW.claim_evidence)
    LOOP
      IF jsonb_typeof(evidence) <> 'object'
         OR nullif(btrim(evidence->>'claim'),'') IS NULL
         OR (evidence->>'source_url') !~ '^https://[^[:space:]]+$'
         OR evidence->>'verified' IS DISTINCT FROM 'true'
         OR nullif(btrim(evidence->>'verification_note'),'') IS NULL THEN
        RAISE EXCEPTION 'Every claim needs a verified HTTPS source and review note'
          USING ERRCODE='check_violation';
      END IF;
    END LOOP;
    NEW.published_at := now();
  END IF;
  IF OLD.status = 'published' AND NEW.status = 'published'
     AND (NEW.published_at IS DISTINCT FROM OLD.published_at
       OR NEW.claim_evidence IS DISTINCT FROM OLD.claim_evidence
       OR NEW.author_name IS DISTINCT FROM OLD.author_name
       OR NEW.hero_image_url IS DISTINCT FROM OLD.hero_image_url) THEN
    RAISE EXCEPTION 'Unpublish before changing published provenance'
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_article_publication_evidence() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS content_drafts_publication_evidence ON public.content_drafts;
CREATE TRIGGER content_drafts_publication_evidence
BEFORE INSERT OR UPDATE ON public.content_drafts
FOR EACH ROW EXECUTE FUNCTION public.enforce_article_publication_evidence();

-- Public view exposes only approved public provenance; private reviewer IDs
-- and internal verification notes are deliberately excluded.
CREATE OR REPLACE VIEW public.published_articles
WITH (security_invoker = true) AS
SELECT title,slug,meta_title,meta_description,primary_keyword,body_markdown,
       created_at,updated_at,published_at,author_name,reviewer_name,
       hero_image_url,hero_image_width,hero_image_height,hero_image_alt
FROM public.content_drafts
WHERE status = 'published'::public.content_draft_status AND content_type = 'article';

-- Security-invoker view needs underlying column grants for public readers.
GRANT SELECT (published_at,author_name,reviewer_name,hero_image_url,hero_image_width,hero_image_height,hero_image_alt)
ON public.content_drafts TO anon;
