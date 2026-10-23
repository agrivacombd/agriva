-- Publish only admin-approved learning corrections to the public learning page.
grant select on table public.learning_correction_reports to anon, authenticated;
drop policy if exists "Public can read approved learning corrections" on public.learning_correction_reports;
create policy "Public can read approved learning corrections"
  on public.learning_correction_reports for select to anon, authenticated
  using (status = 'approved');
