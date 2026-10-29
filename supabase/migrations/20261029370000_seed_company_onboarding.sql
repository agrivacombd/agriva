-- Seed-company onboarding with explicit review, ownership, and tenant isolation.
CREATE TABLE IF NOT EXISTS public.seed_company_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL CHECK (char_length(trim(company_name)) BETWEEN 2 AND 180),
  legal_name text CHECK (legal_name IS NULL OR char_length(trim(legal_name)) <= 220),
  registration_number text CHECK (registration_number IS NULL OR char_length(trim(registration_number)) <= 100),
  contact_phone text NOT NULL CHECK (char_length(trim(contact_phone)) BETWEEN 6 AND 40),
  business_email text NOT NULL CHECK (char_length(trim(business_email)) BETWEEN 3 AND 254),
  district text NOT NULL CHECK (char_length(trim(district)) BETWEEN 2 AND 100),
  website text CHECK (website IS NULL OR char_length(trim(website)) <= 500),
  product_categories text[] NOT NULL DEFAULT ARRAY['seeds']::text[],
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_reason text CHECK (review_reason IS NULL OR char_length(review_reason) <= 1000),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (applicant_user_id)
);

CREATE TABLE IF NOT EXISTS public.seed_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL UNIQUE REFERENCES public.seed_company_applications(id) ON DELETE RESTRICT,
  company_name text NOT NULL CHECK (char_length(trim(company_name)) BETWEEN 2 AND 180),
  legal_name text,
  registration_number text,
  contact_phone text NOT NULL,
  business_email text NOT NULL,
  district text NOT NULL,
  website text,
  product_categories text[] NOT NULL DEFAULT ARRAY['seeds']::text[],
  verification_status text NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'suspended')),
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seed_company_applications_status_created_idx
  ON public.seed_company_applications(status, created_at);
CREATE INDEX IF NOT EXISTS seed_companies_district_idx
  ON public.seed_companies(district);

ALTER TABLE public.seed_company_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_companies ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.seed_company_applications FROM anon, authenticated;
GRANT SELECT, INSERT ON public.seed_company_applications TO authenticated;
GRANT SELECT ON public.seed_companies TO authenticated;

DROP POLICY IF EXISTS "Applicants can read their own seed company application" ON public.seed_company_applications;
CREATE POLICY "Applicants can read their own seed company application"
ON public.seed_company_applications FOR SELECT TO authenticated
USING (applicant_user_id = (SELECT auth.uid()) OR public.has_platform_admin_access());

DROP POLICY IF EXISTS "Users can submit one seed company application" ON public.seed_company_applications;
CREATE POLICY "Users can submit one seed company application"
ON public.seed_company_applications FOR INSERT TO authenticated
WITH CHECK (
  applicant_user_id = (SELECT auth.uid())
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND review_reason IS NULL
);


DROP POLICY IF EXISTS "Applicants can resubmit rejected applications" ON public.seed_company_applications;
CREATE POLICY "Applicants can resubmit rejected applications"
ON public.seed_company_applications FOR UPDATE TO authenticated
USING (applicant_user_id = (SELECT auth.uid()) AND status = 'rejected')
WITH CHECK (
  applicant_user_id = (SELECT auth.uid())
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND review_reason IS NULL
);

DROP POLICY IF EXISTS "Platform admins can review seed company applications" ON public.seed_company_applications;
CREATE POLICY "Platform admins can review seed company applications"
ON public.seed_company_applications FOR UPDATE TO authenticated
USING (public.has_platform_admin_access())
WITH CHECK (public.has_platform_admin_access());

DROP POLICY IF EXISTS "Company owners and platform admins can read company profiles" ON public.seed_companies;
CREATE POLICY "Company owners and platform admins can read company profiles"
ON public.seed_companies FOR SELECT TO authenticated
USING (owner_user_id = (SELECT auth.uid()) OR public.has_platform_admin_access());

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
  IF p_application_id IS NULL OR p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid application or decision' USING ERRCODE = '22023';
  END IF;
  IF p_decision = 'reject' AND (v_reason IS NULL OR char_length(v_reason) < 3 OR char_length(v_reason) > 1000) THEN
    RAISE EXCEPTION 'A rejection reason of 3 to 1000 characters is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_application
  FROM public.seed_company_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_application.status <> 'pending' THEN
    RAISE EXCEPTION 'Application has already been reviewed' USING ERRCODE = '55000';
  END IF;

  IF p_decision = 'approve' THEN
    INSERT INTO public.seed_companies (
      owner_user_id, application_id, company_name, legal_name, registration_number,
      contact_phone, business_email, district, website, product_categories
    ) VALUES (
      v_application.applicant_user_id, v_application.id, v_application.company_name,
      v_application.legal_name, v_application.registration_number, v_application.contact_phone,
      v_application.business_email, v_application.district, v_application.website,
      v_application.product_categories
    );
  END IF;

  UPDATE public.seed_company_applications
  SET status = CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END,
      review_reason = v_reason,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_application_id
  RETURNING * INTO v_application;

  RETURN v_application;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_review_seed_company_application(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_seed_company_application(uuid,text,text) TO authenticated;
