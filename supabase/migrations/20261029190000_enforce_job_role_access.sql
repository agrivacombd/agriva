-- Enforce job-marketplace role boundaries at the database layer as well as in Server Actions.
-- Supports both legacy profile roles and controlled role memberships; never trusts user metadata.
DROP POLICY IF EXISTS "Authenticated users can create own job drafts" ON public.job_posts;
CREATE POLICY "Employers can create own job drafts"
ON public.job_posts
FOR INSERT TO authenticated
WITH CHECK (
  employer_id = (SELECT auth.uid())
  AND status IN ('draft', 'pending')
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role::text = 'employer'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = (SELECT auth.uid()) AND m.role = 'employer'
    )
  )
);

DROP POLICY IF EXISTS "Candidates can apply to published jobs" ON public.job_applications;
CREATE POLICY "Job seekers can apply to published jobs"
ON public.job_applications
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('job_seeker', 'worker')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = (SELECT auth.uid()) AND m.role IN ('job_seeker', 'worker')
    )
  )
  AND EXISTS (
    SELECT 1 FROM public.job_posts j
    WHERE j.id = job_id
      AND j.status = 'published'
      AND (j.application_deadline IS NULL OR j.application_deadline > now())
      AND j.employer_id <> (SELECT auth.uid())
  )
);

COMMENT ON POLICY "Employers can create own job drafts" ON public.job_posts IS
  'Database-enforced employer role and owner boundary for job creation.';
COMMENT ON POLICY "Job seekers can apply to published jobs" ON public.job_applications IS
  'Database-enforced job-seeker/worker role, candidate ownership, published job and deadline boundary.';
