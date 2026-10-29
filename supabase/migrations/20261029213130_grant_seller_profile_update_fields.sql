-- Allow authenticated users to update only their own seller/business profile fields.
-- Row ownership remains enforced by the existing profiles_update_own RLS policy.
-- Sensitive role and identity fields intentionally remain excluded.
GRANT UPDATE (
  full_name,
  phone,
  business_name,
  business_address,
  business_district,
  trade_license_number,
  trade_license_expiry,
  seed_registration_number,
  other_registration_details,
  updated_at
) ON TABLE public.profiles TO authenticated;
