-- Expose only reviewed, publishable learning corrections to public clients.
-- Keep reporter contact details and moderation notes private in the source table.

revoke select on table public.learning_correction_reports from anon;

create or replace view public.published_learning_corrections
with (security_barrier = true)
as
select
  id,
  content_slug,
  content_title,
  reported_text,
  suggested_correction,
  source_url,
  reviewed_at
from public.learning_correction_reports
where status = 'approved'
  and suggested_correction is not null;

revoke all on table public.published_learning_corrections from public;
grant select on table public.published_learning_corrections to anon, authenticated;
