DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        coalesce(qual, '') ~ 'auth[.]uid[(][)]'
        OR coalesce(with_check, '') ~ 'auth[.]uid[(][)]'
      )
  LOOP
    new_qual := CASE
      WHEN p.qual IS NULL THEN NULL
      ELSE regexp_replace(p.qual, 'auth[.]uid[(][)]', '(select auth.uid())', 'g')
    END;
    new_check := CASE
      WHEN p.with_check IS NULL THEN NULL
      ELSE regexp_replace(p.with_check, 'auth[.]uid[(][)]', '(select auth.uid())', 'g')
    END;

    IF p.qual IS NOT NULL AND new_qual IS DISTINCT FROM p.qual THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        p.policyname, p.schemaname, p.tablename, new_qual
      );
    END IF;
    IF p.with_check IS NOT NULL AND new_check IS DISTINCT FROM p.with_check THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        p.policyname, p.schemaname, p.tablename, new_check
      );
    END IF;
  END LOOP;
END
$$;
