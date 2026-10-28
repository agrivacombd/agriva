-- Align content-draft row access with the application capability map.
-- Draft-capable roles may read drafts; only review-capable roles may mutate them.
DROP POLICY IF EXISTS "content_drafts_admin_all" ON public.content_drafts;
DROP POLICY IF EXISTS content_drafts_capability_read ON public.content_drafts;
DROP POLICY IF EXISTS content_drafts_review_update ON public.content_drafts;

CREATE POLICY content_drafts_capability_read
ON public.content_drafts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY (ARRAY[
        'admin', 'super_admin', 'content_seo_manager', 'marketing_manager',
        'educator', 'expert', 'agriculturist', 'agronomist'
      ])
  )
  OR EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = ANY (ARRAY[
        'admin', 'super_admin', 'content_seo_manager', 'marketing_manager',
        'educator', 'expert', 'agriculturist', 'agronomist'
      ])
  )
);

CREATE POLICY content_drafts_review_update
ON public.content_drafts
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager'])
  )
  OR EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager'])
  )
  OR EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager'])
  )
);

DROP POLICY IF EXISTS content_draft_revisions_admin_read ON public.content_draft_revisions;
CREATE POLICY content_draft_revisions_admin_read
ON public.content_draft_revisions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager'])
  )
  OR EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager'])
  )
);
