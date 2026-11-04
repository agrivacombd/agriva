-- Phase 1.2: close direct Admin RBAC writes and expose audited, actor-bound RPCs.
-- Forward-only; validate on an isolated Supabase development branch before any rollout.
-- Production is intentionally untouched by this repository migration.

BEGIN;

-- Keep reads available to authenticated Admin tooling, but all role mutations
-- must pass through the audited SECURITY DEFINER RPCs below.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.admin_roles,
  public.admin_role_permissions,
  public.admin_user_roles
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_grant_user_role(
  p_user_id uuid,
  p_role_key text,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_role_id uuid;
  v_assignment_id uuid;
  v_existing_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- A generic delegated roles.grant capability is not sufficient. Only an
  -- active Super Admin assignment may manage the RBAC control plane.
  IF NOT private.has_admin_permission('roles.grant')
     OR NOT EXISTS (
       SELECT 1
       FROM public.admin_user_roles ur
       JOIN public.admin_roles r ON r.id = ur.role_id
       WHERE ur.user_id = v_actor
         AND r.role_key = 'super_admin'
         AND ur.scope_type = 'global'
         AND ur.scope_id IS NULL
         AND (ur.expires_at IS NULL OR ur.expires_at > now())
     ) THEN
    RAISE EXCEPTION 'Super Admin role manager required' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL OR p_role_key IS NULL OR btrim(p_role_key) = ''
     OR p_user_id = v_actor THEN
    RAISE EXCEPTION 'Invalid target; self-grant is not allowed' USING ERRCODE = '22023';
  END IF;

  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'Role expiry must be in the future' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_role_id
  FROM public.admin_roles
  WHERE role_key = p_role_key;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Unknown Admin role' USING ERRCODE = '22023';
  END IF;

  -- Serialize grants for the same target/role/scope to make the upsert safe
  -- despite the existing expression-based unique index.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || v_role_id::text || ':global', 0)
  );

  SELECT id INTO v_existing_id
  FROM public.admin_user_roles
  WHERE user_id = p_user_id
    AND role_id = v_role_id
    AND scope_type = 'global'
    AND scope_id IS NULL
  FOR UPDATE;

  IF v_existing_id IS NULL THEN
    INSERT INTO public.admin_user_roles (
      user_id, role_id, scope_type, scope_id, granted_by, granted_at, expires_at
    ) VALUES (
      p_user_id, v_role_id, 'global', NULL, v_actor, now(), p_expires_at
    )
    RETURNING id INTO v_assignment_id;
  ELSE
    UPDATE public.admin_user_roles
    SET granted_by = v_actor,
        granted_at = now(),
        expires_at = p_expires_at
    WHERE id = v_existing_id
    RETURNING id INTO v_assignment_id;
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_id, action, entity_type, entity_id, metadata
  ) VALUES (
    v_actor,
    'admin.role.granted',
    'admin_user_role',
    v_assignment_id,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'role_key', p_role_key,
      'scope_type', 'global',
      'scope_id', NULL,
      'expires_at', p_expires_at,
      'operation', CASE WHEN v_existing_id IS NULL THEN 'insert' ELSE 'renew' END
    )
  );

  RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_user_role(
  p_user_id uuid,
  p_role_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_role_id uuid;
  v_assignment_id uuid;
  v_active_super_admins bigint;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT private.has_admin_permission('roles.grant')
     OR NOT EXISTS (
       SELECT 1
       FROM public.admin_user_roles ur
       JOIN public.admin_roles r ON r.id = ur.role_id
       WHERE ur.user_id = v_actor
         AND r.role_key = 'super_admin'
         AND ur.scope_type = 'global'
         AND ur.scope_id IS NULL
         AND (ur.expires_at IS NULL OR ur.expires_at > now())
     ) THEN
    RAISE EXCEPTION 'Super Admin role manager required' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL OR p_role_key IS NULL OR btrim(p_role_key) = ''
     OR p_user_id = v_actor THEN
    RAISE EXCEPTION 'Invalid target; self-revoke is not allowed' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_role_id
  FROM public.admin_roles
  WHERE role_key = p_role_key;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Unknown Admin role' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || v_role_id::text || ':global', 0)
  );

  IF p_role_key = 'super_admin' THEN
    -- Serialize every Super Admin revocation globally. Per-target locks alone
    -- allow concurrent revocations of different users to both observe a count
    -- of 2 and remove the final two assignments.
    PERFORM pg_advisory_xact_lock(
      hashtextextended('admin:super_admin:global', 0)
    );

    SELECT count(*) INTO v_active_super_admins
    FROM public.admin_user_roles ur
    JOIN public.admin_roles r ON r.id = ur.role_id
    WHERE r.role_key = 'super_admin'
      AND ur.scope_type = 'global'
      AND ur.scope_id IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now());

    IF v_active_super_admins <= 1 THEN
      RAISE EXCEPTION 'Cannot revoke the last active Super Admin' USING ERRCODE = '23514';
    END IF;
  END IF;

  DELETE FROM public.admin_user_roles
  WHERE user_id = p_user_id
    AND role_id = v_role_id
    AND scope_type = 'global'
    AND scope_id IS NULL
  RETURNING id INTO v_assignment_id;

  IF v_assignment_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_id, action, entity_type, entity_id, metadata
  ) VALUES (
    v_actor,
    'admin.role.revoked',
    'admin_user_role',
    v_assignment_id,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'role_key', p_role_key,
      'scope_type', 'global',
      'scope_id', NULL,
      'revoked_at', now()
    )
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_user_role(uuid, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_revoke_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_user_role(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_user_role(uuid, text) TO authenticated;

COMMIT;
