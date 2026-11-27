\set ON_ERROR_STOP on

do $$
begin
  if to_regclass('public.push_delivery_queue') is null then
    raise exception 'push_delivery_queue table is missing';
  end if;

  if not exists (
    select 1 from pg_class
    where oid = 'public.push_delivery_queue'::regclass and relrowsecurity
  ) then
    raise exception 'push delivery queue RLS is not enabled';
  end if;

  if has_table_privilege('anon', 'public.push_delivery_queue', 'SELECT')
     or has_table_privilege('authenticated', 'public.push_delivery_queue', 'SELECT')
     or has_table_privilege('service_role', 'public.push_delivery_queue', 'SELECT')
     or has_table_privilege('anon', 'public.push_delivery_queue', 'INSERT')
     or has_table_privilege('authenticated', 'public.push_delivery_queue', 'INSERT')
     or has_table_privilege('service_role', 'public.push_delivery_queue', 'INSERT') then
    raise exception 'client roles must not access the push delivery queue';
  end if;

  if has_table_privilege('anon', 'public.push_subscriptions', 'SELECT')
     or has_table_privilege('authenticated', 'public.push_subscriptions', 'SELECT')
     or has_table_privilege('anon', 'public.push_subscriptions', 'INSERT')
     or has_table_privilege('authenticated', 'public.push_subscriptions', 'INSERT') then
    raise exception 'browser push subscriptions must be server-managed only';
  end if;

  if not has_function_privilege('service_role', 'public.claim_push_delivery_batch(integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.claim_push_delivery_batch(integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.claim_push_delivery_batch(integer)', 'EXECUTE') then
    raise exception 'push claim RPC grants are not least-privilege';
  end if;

  if not has_function_privilege('service_role', 'public.complete_push_delivery(uuid,boolean,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.complete_push_delivery(uuid,boolean,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.complete_push_delivery(uuid,boolean,text)', 'EXECUTE') then
    raise exception 'push completion RPC grants are not least-privilege';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_queue_marketplace_push_delivery'
      and tgrelid = 'public.notifications'::regclass
      and not tgisinternal
  ) then
    raise exception 'notification outbox trigger is missing';
  end if;

  if not exists (
    select 1 from cron.job
    where jobname = 'agriva-marketplace-push-delivery'
      and schedule = '* * * * *'
      and active
  ) then
    raise exception 'one-minute push delivery cron job is missing';
  end if;

  if not exists (
    select 1 from pg_extension where extname = 'pg_net'
  ) then
    raise exception 'pg_net extension is not installed';
  end if;
end
$$;

select 'Marketplace push delivery security checks passed' as result;
