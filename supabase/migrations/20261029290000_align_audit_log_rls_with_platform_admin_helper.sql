-- Keep audit-log RLS aligned with the shared platform-admin authorization helper.
-- This includes protected profiles.role = 'super_admin' accounts and controlled
-- admin/super_admin memberships without granting any write access.
DROP POLICY IF EXISTS "audit_admin_read" ON public.admin_audit_log;
CREATE POLICY "audit_admin_read"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_platform_admin_access());

COMMENT ON POLICY "audit_admin_read" ON public.admin_audit_log IS
  'Read-only audit access via the shared platform-admin helper; writes remain restricted to trusted RPC paths.';
