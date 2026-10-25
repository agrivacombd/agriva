-- Additive multi-role foundation. Keep profiles.role temporarily for legacy
-- code paths; this table is the canonical membership model for new features.
CREATE TABLE public.user_role_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'farmer', 'seller', 'reseller', 'buyer', 'job_seeker', 'worker',
    'employer', 'expert', 'educator', 'transport_provider', 'organization', 'admin'
  )),
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX user_role_memberships_user_id_idx
  ON public.user_role_memberships(user_id);

ALTER TABLE public.user_role_memberships ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_role_memberships FROM PUBLIC;
REVOKE ALL ON TABLE public.user_role_memberships FROM anon;
REVOKE ALL ON TABLE public.user_role_memberships FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_role_memberships TO authenticated;

CREATE POLICY user_role_memberships_select_own_or_admin
  ON public.user_role_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY user_role_memberships_admin_manage
  ON public.user_role_memberships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.user_role
    )
  );

-- Preserve each account's current role while introducing the multi-role model.
INSERT INTO public.user_role_memberships (user_id, role)
SELECT p.id, p.role::text
FROM public.profiles p
WHERE p.role::text IN ('farmer', 'reseller', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
