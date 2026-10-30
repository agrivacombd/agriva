-- Harden exposed SECURITY DEFINER RPCs behind a non-exposed implementation schema.
-- Public RPC signatures and existing EXECUTE grants are preserved as SECURITY INVOKER
-- wrappers. Original privileged implementations retain their authorization checks.
-- Keep the private schema out of PostgREST's exposed-schema allowlist.

CREATE SCHEMA IF NOT EXISTS private AUTHORIZATION postgres;
ALTER SCHEMA private OWNER TO postgres;
REVOKE CREATE ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO PUBLIC;

DO $$
DECLARE
  r record;
  v_call_args text;
  v_body text;
  v_volatility text;
  v_strict text;
  v_parallel text;
  v_acl aclitem[];
  g record;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname,
           pg_get_function_identity_arguments(p.oid) AS identity_args,
           pg_get_function_arguments(p.oid) AS arguments,
           pg_get_function_result(p.oid) AS result_type,
           p.pronargs, p.proretset, p.provolatile, p.proisstrict,
           p.proparallel, p.proacl, p.proowner
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname <> 'enforce_seller_product_moderation'
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
    ORDER BY p.proname, p.oid
  LOOP
    v_acl := coalesce(r.proacl, acldefault('f', r.proowner));

    SELECT string_agg('$' || i::text, ', ' ORDER BY i)
      INTO v_call_args
    FROM generate_series(1, r.pronargs) AS i;

    IF r.proretset THEN
      v_body := format('SELECT * FROM private.%I(%s)', r.proname, coalesce(v_call_args, ''));
    ELSE
      v_body := format('SELECT private.%I(%s)', r.proname, coalesce(v_call_args, ''));
    END IF;

    v_volatility := CASE r.provolatile
      WHEN 'i' THEN 'IMMUTABLE'
      WHEN 's' THEN 'STABLE'
      ELSE 'VOLATILE'
    END;
    v_strict := CASE WHEN r.proisstrict THEN 'STRICT' ELSE 'CALLED ON NULL INPUT' END;
    v_parallel := CASE r.proparallel
      WHEN 's' THEN 'PARALLEL SAFE'
      WHEN 'r' THEN 'PARALLEL RESTRICTED'
      ELSE 'PARALLEL UNSAFE'
    END;

    -- Move the original function OID so existing triggers/policies/dependencies
    -- continue to reference the same implementation.
    EXECUTE format('ALTER FUNCTION %s SET SCHEMA private', r.oid::regprocedure);

    EXECUTE format(
      'CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql %s %s %s
       SECURITY INVOKER
       SET search_path TO pg_catalog, public, private, pg_temp
       AS %L',
      r.proname, r.arguments, r.result_type,
      v_volatility, v_strict, v_parallel, v_body
    );

    -- Remove CREATE FUNCTION's default PUBLIC execute grant, then restore the
    -- exact effective EXECUTE recipients from the original function ACL.
    EXECUTE format(
      'REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated, service_role',
      r.proname, r.identity_args
    );

    FOR g IN
      SELECT DISTINCT grantee
      FROM aclexplode(v_acl)
      WHERE privilege_type = 'EXECUTE' AND grantee <> r.proowner
    LOOP
      IF g.grantee = 0 THEN
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION public.%I(%s) TO PUBLIC',
          r.proname, r.identity_args
        );
      ELSE
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION public.%I(%s) TO %I',
          r.proname, r.identity_args, pg_get_userbyid(g.grantee)
        );
      END IF;
    END LOOP;
  END LOOP;

  -- This trigger-returning guard has no current trigger dependency; move it out of
  -- public and revoke all client EXECUTE grants so it cannot be invoked as an RPC.
  IF to_regprocedure('public.enforce_seller_product_moderation()') IS NOT NULL THEN
    ALTER FUNCTION public.enforce_seller_product_moderation() SET SCHEMA private;
    REVOKE ALL ON FUNCTION private.enforce_seller_product_moderation()
      FROM PUBLIC, anon, authenticated, service_role;
  END IF;
END
$$;

-- Index every foreign-key column reported as unindexed by Performance Advisor.
CREATE INDEX IF NOT EXISTS admin_user_roles_granted_by_idx ON public.admin_user_roles (granted_by);
CREATE INDEX IF NOT EXISTS admin_user_roles_role_id_idx ON public.admin_user_roles (role_id);
CREATE INDEX IF NOT EXISTS farm_members_invited_by_idx ON public.farm_members (invited_by);
CREATE INDEX IF NOT EXISTS farmer_profiles_reviewed_by_idx ON public.farmer_profiles (reviewed_by);
CREATE INDEX IF NOT EXISTS gardener_profiles_reviewed_by_idx ON public.gardener_profiles (reviewed_by);
CREATE INDEX IF NOT EXISTS module_access_application_events_actor_id_idx ON public.module_access_application_events (actor_id);
CREATE INDEX IF NOT EXISTS module_access_applications_organization_id_idx ON public.module_access_applications (organization_id);
CREATE INDEX IF NOT EXISTS module_access_applications_reviewed_by_idx ON public.module_access_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS organization_members_invited_by_idx ON public.organization_members (invited_by);
CREATE INDEX IF NOT EXISTS user_module_grants_granted_by_idx ON public.user_module_grants (granted_by);
CREATE INDEX IF NOT EXISTS user_module_grants_revoked_by_idx ON public.user_module_grants (revoked_by);

-- Keep public visitors limited to published, in-deadline jobs. Authenticated users
-- retain published jobs, their own jobs, and admin visibility in one policy.
DROP POLICY IF EXISTS "Admins can read all job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Employers can read their own jobs" ON public.job_posts;
DROP POLICY IF EXISTS "Published jobs are publicly readable" ON public.job_posts;

CREATE POLICY "Published jobs are publicly readable"
  ON public.job_posts FOR SELECT TO anon
  USING (status = 'published' AND (application_deadline IS NULL OR application_deadline > now()));

CREATE POLICY "Authenticated users can read permitted job posts"
  ON public.job_posts FOR SELECT TO authenticated
  USING (
    (status = 'published' AND (application_deadline IS NULL OR application_deadline > now()))
    OR employer_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS "Candidates can read own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can read applications for own jobs" ON public.job_applications;

CREATE POLICY "Candidates and employers can read relevant applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    candidate_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.job_posts j
      WHERE j.id = job_applications.job_id
        AND j.employer_id = (SELECT auth.uid())
    )
  );

-- Intentionally retain low-signal unused-index INFO findings for now. Statistics
-- are young/reset and include FK, uniqueness, queue and expected feature-query
-- indexes. Reassess after representative traffic instead of dropping on zero scans.
