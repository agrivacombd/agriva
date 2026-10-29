-- Seller-entered product facts and private, optional seller business/licence profile fields.
-- These fields are not public product data. Public pages only expose product_attributes.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_product_attributes_is_object;
ALTER TABLE public.products
  ADD CONSTRAINT products_product_attributes_is_object
  CHECK (jsonb_typeof(product_attributes) = 'object');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_address text,
  ADD COLUMN IF NOT EXISTS business_district text,
  ADD COLUMN IF NOT EXISTS trade_license_number text,
  ADD COLUMN IF NOT EXISTS trade_license_expiry date,
  ADD COLUMN IF NOT EXISTS seed_registration_number text,
  ADD COLUMN IF NOT EXISTS other_registration_details text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_seller_business_fields_length;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_seller_business_fields_length CHECK (
    char_length(coalesce(business_name, '')) <= 160
    AND char_length(coalesce(business_address, '')) <= 300
    AND char_length(coalesce(business_district, '')) <= 100
    AND char_length(coalesce(trade_license_number, '')) <= 100
    AND char_length(coalesce(seed_registration_number, '')) <= 100
    AND char_length(coalesce(other_registration_details, '')) <= 500
  );

COMMENT ON COLUMN public.profiles.business_name IS 'Private seller-provided business name; not a verification claim.';
COMMENT ON COLUMN public.profiles.trade_license_number IS 'Private seller-provided trade licence number; must be independently verified before any badge or compliance approval.';
COMMENT ON COLUMN public.profiles.seed_registration_number IS 'Private seller-provided seed registration/dealer licence reference; must be independently verified before any badge or compliance approval.';
COMMENT ON COLUMN public.products.product_attributes IS 'Structured seller-provided product facts used for category-specific product details.';
