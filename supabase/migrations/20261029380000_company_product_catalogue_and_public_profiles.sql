-- Company-owned catalogue entries, public-safe company profiles, and product-image upload scope.
ALTER TABLE public.seed_companies
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS public_description text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS public_profile_enabled boolean NOT NULL DEFAULT true;

UPDATE public.seed_companies
SET slug = coalesce(nullif(trim(both '-' from regexp_replace(lower(company_name), '[^a-z0-9]+', '-', 'g')), ''), 'company') || '-' || left(id::text, 8)
WHERE slug IS NULL OR trim(slug) = '';

ALTER TABLE public.seed_companies ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS seed_companies_slug_unique_idx ON public.seed_companies(slug);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seed_company_id uuid REFERENCES public.seed_companies(id) ON DELETE RESTRICT;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_listing_source_check;
ALTER TABLE public.products ADD CONSTRAINT products_listing_source_check
  CHECK (listing_source IN ('platform', 'seller', 'company'));

CREATE INDEX IF NOT EXISTS products_seed_company_status_idx
  ON public.products(seed_company_id, status, moderation_status, created_at DESC);

-- Keep company identity private by default at the table layer. These narrow RPCs
-- expose only approved public-profile fields and never expose licence/contact data.
CREATE OR REPLACE FUNCTION public.get_public_seed_company_profile(p_slug text)
RETURNS TABLE (
  id uuid, slug text, company_name text, district text, website text,
  product_categories text[], public_description text, logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT c.id, c.slug, c.company_name, c.district, c.website,
         c.product_categories, c.public_description, c.logo_url
  FROM public.seed_companies AS c
  WHERE c.slug = p_slug
    AND c.verification_status = 'verified'
    AND c.public_profile_enabled = true
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_seed_company_profile_by_id(p_company_id uuid)
RETURNS TABLE (
  id uuid, slug text, company_name text, district text, website text,
  product_categories text[], public_description text, logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT c.id, c.slug, c.company_name, c.district, c.website,
         c.product_categories, c.public_description, c.logo_url
  FROM public.seed_companies AS c
  WHERE c.id = p_company_id
    AND c.verification_status = 'verified'
    AND c.public_profile_enabled = true
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_seed_company_slugs()
RETURNS TABLE (slug text, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT c.slug, c.updated_at
  FROM public.seed_companies AS c
  WHERE c.verification_status = 'verified'
    AND c.public_profile_enabled = true;
$function$;

REVOKE ALL ON FUNCTION public.get_public_seed_company_profile(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_seed_company_profile_by_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_seed_company_slugs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_seed_company_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_seed_company_profile_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_seed_company_slugs() TO anon, authenticated;

-- Company owners can upload/manage images only inside their own UUID folder.
DROP POLICY IF EXISTS "Verified companies can upload own product images" ON storage.objects;
CREATE POLICY "Verified companies can upload own product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.seed_companies c
    WHERE c.owner_user_id = auth.uid()
      AND c.verification_status = 'verified'
  )
);

DROP POLICY IF EXISTS "Verified companies can update own product images" ON storage.objects;
CREATE POLICY "Verified companies can update own product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.seed_companies c
    WHERE c.owner_user_id = auth.uid()
      AND c.verification_status = 'verified'
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.seed_companies c
    WHERE c.owner_user_id = auth.uid()
      AND c.verification_status = 'verified'
  )
);

DROP POLICY IF EXISTS "Verified companies can delete own product images" ON storage.objects;
CREATE POLICY "Verified companies can delete own product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.seed_companies c
    WHERE c.owner_user_id = auth.uid()
      AND c.verification_status = 'verified'
  )
);

-- Generate a stable public slug at approval time; append the company UUID suffix
-- to avoid collisions between similar names.
-- Allow only verified company owners to create company-attributed draft products.
DROP POLICY IF EXISTS "Verified companies can create own draft products" ON public.products;
CREATE POLICY "Verified companies can create own draft products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (
  farmer_id = (SELECT auth.uid())
  AND listing_source = 'company'
  AND status = 'draft'
  AND moderation_status = 'pending'
  AND seed_company_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.seed_companies c
    WHERE c.id = seed_company_id
      AND c.owner_user_id = (SELECT auth.uid())
      AND c.verification_status = 'verified'
  )
);

CREATE OR REPLACE FUNCTION public.admin_review_seed_company_application(
  p_application_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS public.seed_company_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_application public.seed_company_applications;
  v_reason text := NULLIF(trim(COALESCE(p_reason, '')), '');
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_platform_admin_access() THEN
    RAISE EXCEPTION 'Platform admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_application_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid application or decision' USING ERRCODE = '22023';
  END IF;
  IF p_decision = 'reject' AND (v_reason IS NULL OR char_length(v_reason) < 3 OR char_length(v_reason) > 1000) THEN
    RAISE EXCEPTION 'A rejection reason of 3 to 1000 characters is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_application
  FROM public.seed_company_applications
  WHERE id = p_application_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0002'; END IF;
  IF v_application.status <> 'pending' THEN
    RAISE EXCEPTION 'Application has already been reviewed' USING ERRCODE = '55000';
  END IF;

  INSERT INTO public.seed_company_application_reviews (
    application_id, applicant_user_id, reviewer_user_id, decision, reason
  ) VALUES (
    v_application.id, v_application.applicant_user_id, auth.uid(), p_decision, v_reason
  );

  IF p_decision = 'approve' THEN
    INSERT INTO public.seed_companies (
      owner_user_id, application_id, company_name, legal_name, registration_number,
      contact_phone, business_email, district, website, product_categories, slug
    ) VALUES (
      v_application.applicant_user_id, v_application.id, v_application.company_name,
      v_application.legal_name, v_application.registration_number, v_application.contact_phone,
      v_application.business_email, v_application.district, v_application.website,
      v_application.product_categories,
      coalesce(nullif(trim(both '-' from regexp_replace(lower(v_application.company_name), '[^a-z0-9]+', '-', 'g')), ''), 'company') || '-' || left(gen_random_uuid()::text, 8)
    );
  END IF;

  UPDATE public.seed_company_applications
  SET status = CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END,
      review_reason = v_reason, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  WHERE id = p_application_id
  RETURNING * INTO v_application;
  RETURN v_application;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_review_seed_company_application(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_seed_company_application(uuid,text,text) TO authenticated;
