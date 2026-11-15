-- Expose ONLY the public Clarity project ID, never the admin integration row.
-- This keeps the existing admin-only site_integrations RLS policy intact.
create or replace function public.get_enabled_clarity_project_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (config ->> 'project_id') ~ '^[a-zA-Z0-9]{6,24}$'
      then config ->> 'project_id'
    else null
  end
  from public.site_integrations
  where provider_key = 'microsoft_clarity'
    and category = 'analytics'
    and enabled = true
  limit 1
$$;

revoke all on function public.get_enabled_clarity_project_id() from public;
grant execute on function public.get_enabled_clarity_project_id() to anon, authenticated;
