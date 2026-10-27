-- Index foreign-key columns used to join and filter job moderation audit events.
-- PostgreSQL does not automatically index the referencing side of a foreign key.
-- Keep these as separate indexes because admin_id and job_id are queried independently.

create index if not exists idx_job_moderation_events_admin_id
  on public.job_moderation_events (admin_id);

create index if not exists idx_job_moderation_events_job_id
  on public.job_moderation_events (job_id);
