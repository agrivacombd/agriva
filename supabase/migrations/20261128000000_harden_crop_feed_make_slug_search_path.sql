-- Harden object lookup for the immutable crop-feed slug helper.
-- The function remains SECURITY INVOKER; no privilege or behavior change is intended.
alter function public.crop_feed_make_slug(text, text, uuid)
  set search_path = pg_catalog, public, pg_temp;
