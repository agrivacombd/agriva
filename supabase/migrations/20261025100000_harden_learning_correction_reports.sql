-- Tighten public correction report input validation without touching existing reports.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'learning_correction_reports_source_url_http_check') then
    alter table public.learning_correction_reports
      add constraint learning_correction_reports_source_url_http_check
      check (source_url is null or source_url ~* '^https?://[^[:space:]]+$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'learning_correction_reports_reporter_email_format_check') then
    alter table public.learning_correction_reports
      add constraint learning_correction_reports_reporter_email_format_check
      check (reporter_email is null or reporter_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') not valid;
  end if;
end $$;

-- Validate the constraints after adding them. Existing rows are expected to satisfy the
-- existing UI's URL/email validation; if any legacy row does not, the migration fails safely.
alter table public.learning_correction_reports validate constraint learning_correction_reports_source_url_http_check;
alter table public.learning_correction_reports validate constraint learning_correction_reports_reporter_email_format_check;
