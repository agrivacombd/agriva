CREATE INDEX IF NOT EXISTS content_draft_revisions_changed_by_idx ON public.content_draft_revisions (changed_by);
CREATE INDEX IF NOT EXISTS job_moderation_events_admin_id_idx ON public.job_moderation_events (admin_id);
CREATE INDEX IF NOT EXISTS job_moderation_events_job_id_idx ON public.job_moderation_events (job_id);
CREATE INDEX IF NOT EXISTS learning_correction_reports_reviewed_by_idx ON public.learning_correction_reports (reviewed_by);
CREATE INDEX IF NOT EXISTS user_role_memberships_granted_by_idx ON public.user_role_memberships (granted_by);
