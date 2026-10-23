-- Evaluate auth.uid() once per statement instead of once per row in RLS expressions.
-- Preserve existing explicit scalar subqueries; recreate only policies whose expressions change.
do $migration$
declare
  p record;
  v_qual text;
  v_check text;
  v_roles text;
  v_sql text;
begin
  for p in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') like '%auth.uid()%' or coalesce(with_check, '') like '%auth.uid()%')
  loop
    v_qual := p.qual;
    v_check := p.with_check;

    if v_qual is not null then
      v_qual := replace(v_qual, 'SELECT auth.uid()', '__AGRIVA_KEEP_UID__');
      v_qual := replace(v_qual, 'select auth.uid()', '__AGRIVA_KEEP_UID__');
      v_qual := replace(v_qual, 'auth.uid()', '(select auth.uid())');
      v_qual := replace(v_qual, '__AGRIVA_KEEP_UID__', 'SELECT auth.uid()');
    end if;

    if v_check is not null then
      v_check := replace(v_check, 'SELECT auth.uid()', '__AGRIVA_KEEP_UID__');
      v_check := replace(v_check, 'select auth.uid()', '__AGRIVA_KEEP_UID__');
      v_check := replace(v_check, 'auth.uid()', '(select auth.uid())');
      v_check := replace(v_check, '__AGRIVA_KEEP_UID__', 'SELECT auth.uid()');
    end if;

    if v_qual is distinct from p.qual or v_check is distinct from p.with_check then
      v_roles := array_to_string(p.roles, ', ');
      v_sql := format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
      execute v_sql;

      v_sql := format(
        'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
        p.policyname, p.schemaname, p.tablename, p.permissive, p.cmd, v_roles
      );
      if v_qual is not null then
        v_sql := v_sql || format(' USING (%s)', v_qual);
      end if;
      if v_check is not null then
        v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
      end if;
      execute v_sql;
    end if;
  end loop;
end;
$migration$;
