-- The Clarity project ID is public by design (visible in its browser tag).
-- Do not expose any other analytics or marketing settings to anonymous visitors.
-- Admin save continues to be protected by the existing admin-only RLS policies.
drop policy if exists "Public reads enabled Clarity project ID" on public.site_integrations;
create policy "Public reads enabled Clarity project ID"
on public.site_integrations for select
to anon, authenticated
using (
  provider_key = 'microsoft_clarity'
  and category = 'analytics'
  and enabled = true
  and config ? 'project_id'
  and jsonb_typeof(config -> 'project_id') = 'string'
);
