-- Fast status-history lookups for the AGRIVA admin application queues.
-- Existing reviewed_by/reviewed_at and append-only application events remain the source of truth.
create index if not exists module_access_applications_review_history_idx
  on public.module_access_applications(module, status, reviewed_at desc)
  where status in ('approved', 'rejected');

create index if not exists module_access_applications_recent_idx
  on public.module_access_applications(module, created_at desc);
