-- Align audit-log read RLS with the server-side audit.read capability.
-- Keep inserts/updates/deletes governed by trusted RPCs; this policy is read-only.
DROP POLICY IF EXISTS "audit_admin_read" ON public.admin_audit_log;
CREATE POLICY "audit_admin_read"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_role_memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.role IN ('admin', 'super_admin')
  )
);

COMMENT ON POLICY "audit_admin_read" ON public.admin_audit_log IS
  'Read-only audit access for legacy platform admins and controlled admin/super_admin memberships; write paths remain RPC-owned.';
