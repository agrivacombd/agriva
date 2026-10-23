-- Harden SECURITY DEFINER functions against search_path object shadowing.
-- Keep public in the path for existing AGRIVA objects, resolve built-ins first,
-- and keep pg_temp last.
DO $migration$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path TO pg_catalog, public, pg_temp',
      fn.signature
    );
  END LOOP;
END
$migration$;
