-- The staff-role RPC inserts scoped roles into user_role_memberships, but the
-- membership CHECK constraint previously allowed only customer-facing roles.
-- Add only roles provisioned by the trusted admin_set_staff_role RPC, plus the
-- existing agronomist capability role used by content workflows. Do not add
-- super_admin here: that role requires a separate, owner-controlled grant path.
ALTER TABLE public.user_role_memberships
  DROP CONSTRAINT IF EXISTS user_role_memberships_role_check;

ALTER TABLE public.user_role_memberships
  ADD CONSTRAINT user_role_memberships_role_check
  CHECK (role IN (
    'farmer', 'seller', 'reseller', 'buyer', 'job_seeker', 'worker',
    'employer', 'expert', 'educator', 'transport_provider', 'organization', 'admin',
    'transport', 'student', 'agriculturist', 'rooftop_gardener',
    'operations', 'product_moderator', 'content_seo_manager',
    'marketing_manager', 'finance_manager', 'support_agent', 'agronomist'
  ));

DO $validation$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.user_role_memberships'::regclass
      AND conname = 'user_role_memberships_role_check'
  ) THEN
    RAISE EXCEPTION 'user_role_memberships role constraint was not installed';
  END IF;
END;
$validation$;
