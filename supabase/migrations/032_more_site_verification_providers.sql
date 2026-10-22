-- Add optional provider verification tokens and tracking container IDs.
alter table public.site_public_integrations
  add column if not exists merchant_center_verification text,
  add column if not exists yandex_verification text,
  add column if not exists pinterest_verification text,
  add column if not exists facebook_domain_verification text,
  add column if not exists tiktok_verification text,
  add column if not exists google_tag_manager_id text,
  add column if not exists google_ads_conversion_id text;
