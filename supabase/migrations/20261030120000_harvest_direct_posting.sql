-- Harvest sellers do not need a separate identity approval grant.
-- Keep the existing owner-scoped harvest_listings policies: authenticated users
-- may create their own pending listing; admin moderation controls publication.
drop policy if exists harvest_module_access_insert_guard on public.harvest_listings;
drop policy if exists harvest_module_access_update_guard on public.harvest_listings;
