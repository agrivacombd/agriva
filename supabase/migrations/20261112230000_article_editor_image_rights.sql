-- Editorial attestations are recorded; these are not independent proof of ownership or factual accuracy.
ALTER TABLE public.content_drafts
  ADD COLUMN IF NOT EXISTS hero_image_license text,
  ADD COLUMN IF NOT EXISTS hero_image_rights_note text,
  ADD COLUMN IF NOT EXISTS hero_image_verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS hero_image_verified_at timestamptz;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('article-hero-images','article-hero-images',true,10485760,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- Uploads are performed with the signed-in admin's session; bucket write access is admin-only.
DROP POLICY IF EXISTS article_hero_admin_insert ON storage.objects;
CREATE POLICY article_hero_admin_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'article-hero-images' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'::public.user_role
));
CREATE OR REPLACE FUNCTION public.enforce_article_publication_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE evidence jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' OR NEW.published_at IS NOT NULL THEN
      RAISE EXCEPTION 'New articles must enter the editorial draft workflow' USING ERRCODE='check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'published' AND NEW.status = 'review' THEN NEW.published_at := NULL; END IF;
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    IF NEW.published_at IS NOT NULL THEN
      RAISE EXCEPTION 'Publication timestamp must be set by database' USING ERRCODE='check_violation';
    END IF;
    IF nullif(btrim(NEW.author_name),'') IS NULL OR NEW.author_verified_by IS NULL
       OR nullif(btrim(NEW.reviewer_name),'') IS NULL OR NEW.reviewed_by IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.author_verified_by AND p.role = 'admin'::public.user_role)
       OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.reviewed_by AND p.role = 'admin'::public.user_role) THEN
      RAISE EXCEPTION 'Verified author and admin reviewer required' USING ERRCODE='check_violation';
    END IF;
    IF NEW.hero_image_url !~ '^https://[^[:space:]]+$'
       OR NEW.hero_image_url NOT LIKE '%/storage/v1/object/public/article-hero-images/%'
       OR coalesce(NEW.hero_image_width,0) < 1200 OR coalesce(NEW.hero_image_height,0) < 630
       OR nullif(btrim(NEW.hero_image_alt),'') IS NULL
       OR nullif(btrim(NEW.hero_image_license),'') IS NULL
       OR nullif(btrim(NEW.hero_image_rights_note),'') IS NULL
       OR NEW.hero_image_verified_by IS NULL OR NEW.hero_image_verified_at IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.hero_image_verified_by AND p.role = 'admin'::public.user_role) THEN
      RAISE EXCEPTION 'Verified hosted image, dimensions, rights and alt text required' USING ERRCODE='check_violation';
    END IF;
    IF jsonb_typeof(NEW.claim_evidence) <> 'array' OR jsonb_array_length(NEW.claim_evidence) = 0 THEN
      RAISE EXCEPTION 'Claim evidence required' USING ERRCODE='check_violation';
    END IF;
    FOR evidence IN SELECT value FROM jsonb_array_elements(NEW.claim_evidence) LOOP
      IF jsonb_typeof(evidence) <> 'object'
         OR nullif(btrim(evidence->>'claim'),'') IS NULL
         OR (evidence->>'source_url') !~ '^https://[^[:space:]]+$'
         OR evidence->>'verified' IS DISTINCT FROM 'true'
         OR nullif(btrim(evidence->>'verification_note'),'') IS NULL THEN
        RAISE EXCEPTION 'Each claim requires reviewed source and note' USING ERRCODE='check_violation';
      END IF;
    END LOOP;
    NEW.published_at := now();
  END IF;
  IF OLD.status = 'published' AND NEW.status = 'published'
     AND (NEW.published_at IS DISTINCT FROM OLD.published_at
       OR NEW.claim_evidence IS DISTINCT FROM OLD.claim_evidence
       OR NEW.author_name IS DISTINCT FROM OLD.author_name
       OR NEW.hero_image_url IS DISTINCT FROM OLD.hero_image_url) THEN
    RAISE EXCEPTION 'Unpublish before changing published provenance' USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_article_publication_evidence() FROM PUBLIC, anon, authenticated;
